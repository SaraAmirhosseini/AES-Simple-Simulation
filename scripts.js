// Helper functions for ArrayBuffer/Base64 conversion
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// AES encryption/decryption functions
async function encryptMessage(message, key) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );
    const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combinedBuffer.set(iv);
    combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);
    return arrayBufferToBase64(combinedBuffer.buffer);
}

async function decryptMessage(cipherText, key) {
    try {
        const combinedBuffer = base64ToArrayBuffer(cipherText);
        const iv = combinedBuffer.slice(0, 12);
        const encryptedBuffer = combinedBuffer.slice(12);
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            encryptedBuffer
        );
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (e) {
        return null;
    }
}

// Function to create an icon element
function createIcon(iconClass) {
    const icon = document.createElement("i");
    icon.className = iconClass;
    return icon;
}

// Main application logic
document.addEventListener("DOMContentLoaded", async function () {
    // Generate AES key (256-bit for demo purposes)
    const aesKey = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true, // extractable key
        ["encrypt", "decrypt"]
    );

    // Export and display encryption key
    const rawKey = await crypto.subtle.exportKey("raw", aesKey);
    const keyBase64 = arrayBufferToBase64(rawKey);
    document.getElementById("encryptionKey").textContent = keyBase64;

    // Define 20 pre-written messages from Amirhossein to Sara in Fingilish
    const messages = [
        "Salam Sara, in Amirhossein ast.",
        "Salam Amirhossein, che khabar?",
        "Man yek payam makhfi ba AES ersal mikonam.",
        "Vay, che jaleb! Chetori in kar ro mikoni?",
        "Ramznegari etminan midahad ke ertebat ma amn ast.",
        "Man hamishe be amniat ertebatat etemad daram.",
        "Aya be ghodrat ramznegari etemad darid?",
        "Bale, man be ghodrat ramznegari etemad daram.",
        "Omidvaram betavanid in payam ra ramzgoshayi konid.",
        "Man ham omidvaram ke betavanam.",
        "AES mokhafaf Advanced Encryption Standard ast.",
        "Man az in mokhafaf khoshm miad.",
        "In shabih-sazi az ramznegari vaghei AES estefade mikonad!",
        "In vaghean jaleb ast!",
        "Kelidhaye ma ba estefade az Web Crypto API tolid mishavand.",
        "Man ham mikhaham in ra yad begiram.",
        "Kelidhaye khosoosi bayad makhfi negah dashte shavand.",
        "Bale, man hamishe kelidhaye khosoosi ra makhfi negah midaram.",
        "Hamishe esalat kelidha ra ta'yid konid.",
        "Man hamishe in kar ra anjam midaham.",
        "Payamresani amn emrooze zarori ast.",
        "Bale, dorost migi.",
        "Man az be eshterak gozashtan in demo ba shoma heyajan-zadam",
        "Man ham heyajan-zadam ke in ra yad begiram.",
        "Tasavor konid tamam asrar ma dar hal enteghal amn hastand.",
        "In vaghean aramesh bakhsh ast.",
        "Ramznegari modern ham ziba va ham ghodratmand ast.",
        "Bale, man ham movafegham.",
        "Hargez kelid khosoosi khod ra ba kasi be eshterak nagozaarid.",
        "Man hichvaght in kar ra nemikonam.",
        "Man montazer goftoguye amn do tarafe hastam.",
        "Man ham montazeram.",
        "Ramznegari kelid harim khosoosi ast.",
        "Bale, dorost migi.",
        "In fanavari zirbanaye ertebatat amn interneti ast.",
        "Man az in fanavari khoshm miad.",
        "Etemad be ramznegari separ ma ast.",
        "Bale, man ham etemad daram.",
        "Khodahafez baraye alan, va imen bemanid!",
        "Khodahafez, movafagh bashi!"
    ];

    // Pre-encrypt all messages with the AES key
    const encryptedMessages = [];
    for (let i = 0; i < messages.length; i++) {
        const cipher = await encryptMessage(messages[i], aesKey);
        encryptedMessages.push({ plain: messages[i], cipher, sender: i % 2 === 0 ? 'ahm' : 'sara' });
    }

    const chatWindow = document.querySelector(".chat-window");
    const privateKeyInput = document.getElementById("privateKey");
    const privateKeyIcon = document.getElementById("privateKey-icon");
    let messageIndex = 0;

    // Function to display the next message
    async function displayNextMessage() {
        if (messageIndex >= encryptedMessages.length) {
            messageIndex = 0;
            chatWindow.innerHTML = "";
        }
        const msgObj = encryptedMessages[messageIndex];
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message", msgObj.sender);
        msgDiv.dataset.cipher = msgObj.cipher;

        // Create sender and message content spans
        const senderSpan = document.createElement("span");
        senderSpan.classList.add("sender");
        senderSpan.textContent = msgObj.sender === 'ahm' ? "Amirhossein: " : "Sara: ";

        const messageSpan = document.createElement("span");
        messageSpan.classList.add("message-content");

        if (privateKeyInput.value.trim() === "parsara") {
            const decrypted = await decryptMessage(msgObj.cipher, aesKey);
            if (decrypted) {
                messageSpan.textContent = decrypted;
                msgDiv.classList.add("decrypted");
                msgDiv.prepend(createIcon("fas fa-unlock"));
            } else {
                messageSpan.textContent = "Decryption error";
            }
        } else {
            messageSpan.textContent = msgObj.cipher;
            msgDiv.prepend(createIcon("fas fa-lock"));
        }

        // Append sender and message content to the message div
        msgDiv.appendChild(senderSpan);
        msgDiv.appendChild(messageSpan);

        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        messageIndex++;
    }

    // Display messages every 5 seconds
    setInterval(displayNextMessage, 5000);

    // Handle private key input changes
    privateKeyInput.addEventListener("input", async function () {
        if (this.value.trim() === "parsara") {
            this.classList.add("valid");
            privateKeyIcon.classList.remove("invalid");
            privateKeyIcon.classList.add("valid");
            privateKeyIcon.classList.replace("fa-times", "fa-check");

            const messageDivs = document.querySelectorAll(".message");
            for (let div of messageDivs) {
                const cipher = div.dataset.cipher;
                const decrypted = await decryptMessage(cipher, aesKey);

                // Clear existing content and re-append with sender prefix
                div.innerHTML = "";
                const senderSpan = document.createElement("span");
                senderSpan.classList.add("sender");
                senderSpan.textContent = div.classList.contains("ahm") ? "Amirhossein: " : "Sara: ";
                const messageSpan = document.createElement("span");
                messageSpan.classList.add("message-content");

                if (decrypted) {
                    messageSpan.textContent = decrypted;
                    div.classList.add("decrypted");
                    div.prepend(createIcon("fas fa-unlock"));
                } else {
                    messageSpan.textContent = "Decryption error";
                }
                div.appendChild(senderSpan);
                div.appendChild(messageSpan);
            }
        } else {
            this.classList.remove("valid");
            privateKeyIcon.classList.remove("valid");
            privateKeyIcon.classList.add("invalid");
            privateKeyIcon.classList.replace("fa-check", "fa-times");

            const messageDivs = document.querySelectorAll(".message");
            for (let div of messageDivs) {
                // Clear existing content and re-append with sender prefix
                div.innerHTML = "";
                const senderSpan = document.createElement("span");
                senderSpan.classList.add("sender");
                senderSpan.textContent = div.classList.contains("ahm") ? "Amirhossein: " : "Sara: ";
                const messageSpan = document.createElement("span");
                messageSpan.classList.add("message-content");
                messageSpan.textContent = div.dataset.cipher;
                div.classList.remove("decrypted");
                div.prepend(createIcon("fas fa-lock"));
                div.appendChild(senderSpan);
                div.appendChild(messageSpan);
            }
        }
    });
});
