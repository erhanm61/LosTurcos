const memberList = document.getElementById("memberList");
const nameInput = document.getElementById("name");
const rankInput = document.getElementById("rank");
const statusInput = document.getElementById("status");
const addMemberBtn = document.getElementById("addMember");
const filters = document.querySelectorAll(".filter");
const chartCanvas = document.getElementById("statsChart");
const pushButton = document.getElementById("pushToDiscord");

const discordWebhookUrl = "https://discord.com/api/webhooks/1356600373783035974/AwwnEqBfeutPL3XEeBtrO8D5KXac0170Xr2pabMo5-vcthZlydlSv-p3m8s4iiYe9xLF";

// Mitgliedsliste aus Local Storage laden
let members = JSON.parse(localStorage.getItem("members")) || [];

const availableRanks = ["Baskan", "Abla", "11er", "10", "Mitglied", "Probezeit"];
const availableStatuses = ["Aktiv", "Wechselbank", "Gebannt"];

// 🔥 Funktion zum Rendern der Tabelle
function updateTable() {
    const tbody = document.querySelector("#sortable");
    tbody.innerHTML = ""; // Tabelle leeren

    members.forEach((member, index) => {
        const row = document.createElement("tr");
        row.setAttribute("data-index", index);
        row.innerHTML = `
            <td>${index + 1}</td> <!-- Nummerierung -->
            <td class="sortable-handle">☰</td> <!-- Drag & Drop -->
            <td>
                <span class="editable" onclick="editName(${index})">${member.name}</span> 
                <span class="edit-icon" onclick="editName(${index})">✏️</span>
            </td>
            <td>
                <select onchange="updateRank(${index}, this.value)">
                    ${availableRanks.map(rank => `<option value="${rank}" ${member.rank === rank ? "selected" : ""}>${rank}</option>`).join("")}
                </select>
            </td>
            <td>
                <select onchange="updateStatus(${index}, this.value)">
                    ${availableStatuses.map(status => `<option value="${status}" ${member.status === status ? "selected" : ""}>${status}</option>`).join("")}
                </select>
            </td>
            <td>
                <button onclick="removeMember(${index})">🗑️ Entfernen</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    initDragAndDrop();  // Drag & Drop aktivieren
    updateStatsSummary();  // Statistik nach dem Rendern der Tabelle aktualisieren
}

// ➕ **Mitglied hinzufügen**
addMemberBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const rank = rankInput.value;
    const status = statusInput.value;

    if (name === "") {
        alert("Bitte einen Namen eingeben!");
        return;
    }

    members.push({ name, rank, status });
    saveData();
    sendToDiscord(`✅ Neues Mitglied: **${name}** als **${rank}** mit Status **${status}**`);
    updateTable();
    nameInput.value = "";
});

// 🔄 **Status aktualisieren**
function updateStatus(index, newStatus) {
    members[index].status = newStatus;
    saveData();
    sendToDiscord(`🔄 Status von **${members[index].name}** auf **${newStatus}** geändert.`);
    updateTable();
}

// 🔄 **Rang aktualisieren**
function updateRank(index, newRank) {
    members[index].rank = newRank;
    saveData();
    sendToDiscord(`🔄 Rang von **${members[index].name}** auf **${newRank}** geändert.`);
    updateTable();
}

// 🗑️ **Mitglied löschen**
// 🗑️ **Mitglied löschen**
function removeMember(index) {
    const memberToRemove = members[index];
    members.splice(index, 1);  // Mitglied aus der Liste entfernen
    saveData();  // Daten speichern, um sicherzustellen, dass die Änderung persistent ist

    // Webhook senden, nachdem das Mitglied entfernt wurde
    sendToDiscord(`❌ Mitglied **${memberToRemove.name}** entfernt.`);
    
    updateTable();  // Tabelle aktualisieren
}

// 🖊️ Name bearbeiten
function editName(index) {
    const row = document.querySelectorAll("#sortable tr")[index];
    const nameSpan = row.querySelector(".editable");
    const originalName = nameSpan.textContent;

    // Erstelle ein Eingabefeld
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalName;

    // Speichern-Icon erstellen
    const saveIcon = document.createElement("span");
    saveIcon.textContent = "💾";
    saveIcon.classList.add("save-icon");

    // Leeren und ersetzen mit Eingabefeld & Speichern-Icon
    nameSpan.innerHTML = "";
    nameSpan.appendChild(input);
    nameSpan.appendChild(saveIcon);

    input.focus(); // Eingabe fokussieren

    // ⏎ Enter-Taste = Speichern & Schließen
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            saveAndExit(index, input.value, originalName);
        }
    });

    // 💾 Klick auf Speichern-Icon = Speichern & Schließen
    saveIcon.addEventListener("click", function () {
        saveAndExit(index, input.value, originalName);
    });

    // Falls Fokus verloren geht (z. B. Klick woanders hin), auch schließen
    input.addEventListener("blur", function () {
        saveAndExit(index, input.value, originalName);
    });
}

// ✅ Speichern & Bearbeitungsmodus verlassen
function saveAndExit(index, newName, originalName) {
    const trimmedName = newName.trim();
    if (trimmedName !== "" && trimmedName !== originalName) {
        members[index].name = trimmedName;
        saveData();
        sendToDiscord(`✏️ Name von **${originalName}** zu **${trimmedName}** geändert.`);
    }

    updateTable(); // 🚀 **Hier wird das Feld geschlossen!**
}


// 🔥 **Speichern in Local Storage**
function saveData() {
    localStorage.setItem("members", JSON.stringify(members));
}

// 📊 **Discord Webhook senden mit nummerierter Liste**
function sendToDiscord(actionMessage) {
    const timestamp = new Date().toLocaleString("de-DE");

    const stats = {
        Aktiv: members.filter(m => m.status === "Aktiv").length,
        Wechselbank: members.filter(m => m.status === "Wechselbank").length,
        Gebannt: members.filter(m => m.status === "Gebannt").length
    };

    let message = `**📅 Letzte Aktualisierung:** ${timestamp}\n\n${actionMessage}\n\n`;
    message += "```\n";
    message += "#  Name                | Rang       | Status     \n";
    message += "--------------------------------------\n";

    members.forEach((member, index) => {
        let num = (index + 1).toString().padEnd(3);
        let name = member.name.padEnd(18);
        let rank = member.rank.padEnd(10);
        let status = member.status.padEnd(10);
        message += `${num} ${name} | ${rank} | ${status}\n`;
    });

    message += "--------------------------------------\n";
    message += `🔹 Aktiv: ${stats.Aktiv}\n`;
    message += `🔸 Wechselbank: ${stats.Wechselbank}\n`;
    message += `❌ Gebannt: ${stats.Gebannt}\n`;
    message += "```";

    fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
    });
}

// ✅ **Drag & Drop Funktionalität aktivieren**
function initDragAndDrop() {
    const tbody = document.querySelector("#sortable");

    new Sortable(tbody, {
        handle: '.sortable-handle',
        animation: 150,
        onEnd: function (evt) {
            const newOrder = Array.from(document.querySelectorAll("#sortable tr")).map(row => {
                return members[row.getAttribute("data-index")];
            });

            members = newOrder;
            saveData();
            updateTable();
        }
    });
}

// 🔥 **Statistik aktualisieren**
function updateStatsSummary() {
    const stats = {
        Aktiv: members.filter(m => m.status === "Aktiv").length,
        Wechselbank: members.filter(m => m.status === "Wechselbank").length,
        Gebannt: members.filter(m => m.status === "Gebannt").length
    };

    // Debugging: Konsolenausgabe zur Überprüfung der Werte
    console.log("Aktive: " + stats.Aktiv + " | Wechselbank: " + stats.Wechselbank + " | Gebannt: " + stats.Gebannt);

    // Anzeige der Statistik auf der Webseite
    document.getElementById("statsSummary").innerText =
        `🔹 Aktiv: ${stats.Aktiv} | 🔸 Wechselbank: ${stats.Wechselbank} | ❌ Gebannt: ${stats.Gebannt}`;
}

// 📤 **Push-Button Funktion**
pushButton.addEventListener("click", () => {
    sendToDiscord("📢 **Manueller Push der aktuellen Mitgliederliste:**");
});

// 🚀 **Initialisieren**
updateTable();
