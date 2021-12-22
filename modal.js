// Somewhere to store out instantiated hub (after init has completed)
let modalHub = null;

// Somewhere we can queue messages if they arrive while another message is displayed
const backlog = [];

/**
 * Action to close the modal dialogue
 */
const closeModal = ev => {

    const modal = document.getElementById("modal");
    modal.style.display = "none";

    const queuedAlert = backlog.pop();
    if (queuedAlert) {
        alert(queuedAlert.header, queuedAlert.msg);
    }

    modalHub.publish("modal-closed", {
        result: ev.target.textContent,
        metadata: JSON.parse(modal.getAttribute("modal-metadata"))
    });
};

/**
 * Create the message window
 */
const initMessageWindow = () => {

    const modal = document.createElement("div");
    modal.setAttribute("id", "modal");

    const messages = document.createElement("div");
    messages.setAttribute("id", "messages");

    const header = document.createElement("h2");
    header.textContent = "Attention";

    const body = document.createElement("p");
    body.textContent = "message";

    const button = document.createElement("button");
    button.setAttribute("id", "close");
    button.textContent = "Close";

    modal.appendChild(messages);
    messages.appendChild(header);
    messages.appendChild(body);
    messages.appendChild(button);

    document.getElementsByTagName("body")[0].appendChild(modal);
};

/**
 * Initialise button actions
 *
 * Walk down one level from the modal DIV, assuming that's where all the
 * dialogues will be, then look for buttons in that dialogue, and add an action
 */
const initButtons = () => {

    const dialogues = [...document.getElementById("modal").children].filter(elem => elem.tagName === "DIV");
    dialogues.forEach(dialogue => {

        const buttons = [...dialogue.children].filter(elem => elem.tagName === "BUTTON");
        buttons.forEach(button => {
            if (button.id === "close") {
                button.addEventListener("click", closeModal);
            }
        });
    });
};

/**
 * Add the pub/sub events we want to listen for
 */
const initPubSub = hub => {

    modalHub = hub.register("modal");
    modalHub.subscribe("alert", alert);
    modalHub.subscribe("options", options);
};

/**
 * Initialise all our messaging elements
 *
 * Takes an event hub where we are expecting to receive events to act upon, or
 * to publish our events
 */
const init = hub => {

    initMessageWindow();
    initButtons();
    initPubSub(hub);
};

/**
 * Pop up the alert dialog
 */
const alert = ({header, msg, metadata}) => {

    const modal = document.getElementById("modal");
    modal.setAttribute("modal-metadata", JSON.stringify(metadata));
    if (modal.style.display === "block") {
        backlog.push ({ header, msg });
        return;
    }

    [...document.getElementById("messages").children].forEach(elem => {

        if (elem.tagName === "H2") {
            elem.textContent = header;
        } else if (elem.tagName === "P") {
            elem.textContent = msg;
        } else if (elem.tagName === "BUTTON") {
            elem.textContent = "Close";
        }
    });

    modal.style.display = "block";
};

/**
 * Create an options button
 */
const optionButton = legend => {

    const button = document.createElement("button");
    button.textContent = legend;
    button.classList.add("option");
    button.addEventListener("click", closeModal);
    return button;
};

/**
 * Let the user choose from multiple options
 */
const options = ({header, options, metadata}) => {

    const modal = document.getElementById("modal");
    modal.setAttribute("modal-metadata", JSON.stringify(metadata));

    if (modal.style.display === "block") {
        backlog.push ({ header, msg });
        return;
    }

    [...document.getElementById("messages").children].forEach(elem => {

        if (elem.tagName === "H2") {
            elem.textContent = header;
        } else if (elem.tagName === "P") {
            elem.textContent = "";
            options.forEach(option => {
                elem.appendChild(optionButton(option));
            });
        } else if (elem.tagName === "BUTTON") {
            elem.textContent = "Cancel";
        }
    });

    modal.style.display = "block";
};

export default {
    init
};
