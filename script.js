const { createClient } = supabase;

const supabaseUrl = "https://kfipgbthawgogyepvibt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaXBnYnRoYXdnb2d5ZXB2aWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MjA1NzEsImV4cCI6MjA1OTA5NjU3MX0.hTQzjkMf-sX8Xkx-WCCEuEGpiYAYgyp5y9iNIe7D2Ag";

const supabaseClient = createClient(supabaseUrl, supabaseKey);

const discordWebhookUrl = "https://discord.com/api/webhooks/1356600373783035974/AwwnEqBfeutPL3XEeBtrO8D5KXac0170Xr2pabMo5-vcthZlydlSv-p3m8s4iiYe9xLF";

const memberList = document.getElementById("memberList");
const nameInput = document.getElementById("name");
const rankInput = document.getElementById("rank");
const statusInput = document.getElementById("status");
const addMemberBtn = document.getElementById("addMember");
const pushButton = document.getElementById("pushToDiscord");

let members = [];

// Mitglieder aus Supabase laden
async function loadMembers() {
    const { data, error } = await supabaseClient.from('members').select('*');
    if (error) {
        console.error("Fehler beim Laden der Mitglieder:", error);
        return;
    }
    members = data || [];
    updateTable();
}

// Mitglied zu Supabase hinzufügen
async function addMemberToSupabase(member) {
    const { error } = await supabaseClient.from('members').insert([member]);
    if (error) console.error("Fehler beim Hinzufügen:", error);
}

// Mitglied in Supabase aktualisieren
async function updateMemberInSupabase(id, updates) {
    const { error } = await supabaseClient.from('members').update(updates).eq('id', id);
    if (error) console.error("Fehler beim Aktualisieren:", error);
}

// Mitglied in Supabase löschen
async function deleteMemberFromSupabase(id) {
    const { error } = await supabaseClient.from('members').delete().eq('id', id);
    if (error) console.error("Fehler beim Löschen:", error);
}

// Tabelle aktualisieren
function updateTable() {
    const tbody = document.querySelector("#sortable");
    tbody.innerHTML = "";

    members.forEach((member, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${member.name}</td>
            <td>
                <select onchange="updateRank(${member.id}, this.value)">
                    ${["Baskan", "Abla", "11er", "10", "Mitglied", "Probezeit"].map(rank =>
                        `<option value="${rank}" ${member.rank === rank ? "selected" : ""}>${rank}</option>`
                    ).join("")}
                </select>
            </td>
            <td>
                <select onchange="updateStatus(${member.id}, this.value)">
                    ${["Aktiv", "Wechselbank", "Gebannt"].map(status =>
                        `<option value="${status}" ${member.status === status ? "selected" : ""}>${status}</option>`
                    ).join("")}
                </select>
            </td>
            <td>
                <button onclick="removeMember(${member.id})">🗑️ Entfernen</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateStatsSummary();
}

// Mitglied hinzufügen
addMemberBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (name === "") {
        alert("Bitte einen Namen eingeben!");
        return;
    }

    const newMember = {
        name,
        rank: rankInput.value,
        status: statusInput.value
    };

    members.push(newMember);
    updateTable();
    sendToDiscord(`✅ Neues Mitglied: **${name}** als **${newMember.rank}** mit Status **${newMember.status}**`);

    await addMemberToSupabase(newMember);
    nameInput.value = "";
});

// Rang aktualisieren
async function updateRank(id, newRank) {
    await updateMemberInSupabase(id, { rank: newRank });
    members.find(m => m.id === id).rank = newRank;
    sendToDiscord(`🔄 Rang von **${members.find(m => m.id === id).name}** auf **${newRank}** geändert.`);
    updateTable();
}

// Status aktualisieren
async function updateStatus(id, newStatus) {
    await updateMemberInSupabase(id, { status: newStatus });
    members.find(m => m.id === id).status = newStatus;
    sendToDiscord(`🔄 Status von **${members.find(m => m.id === id).name}** auf **${newStatus}** geändert.`);
    updateTable();
}

// Mitglied löschen
async function removeMember(id) {
    const member = members.find(m => m.id === id);
    await deleteMemberFromSupabase(id);
    members = members.filter(m => m.id !== id);
    sendToDiscord(`❌ Mitglied **${member.name}** entfernt.`);
    updateTable();
}

// Discord Webhook senden
function sendToDiscord(actionMessage) {
    const message = `📅 **Letzte Aktualisierung:** ${new Date().toLocaleString("de-DE")}\n\n${actionMessage}`;

    fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
    }).catch(error => console.error("Fehler beim Senden an Discord:", error));
}

// Statistik aktualisieren
function updateStatsSummary() {
    const stats = {
        Aktiv: members.filter(m => m.status === "Aktiv").length,
        Wechselbank: members.filter(m => m.status === "Wechselbank").length,
        Gebannt: members.filter(m => m.status === "Gebannt").length
    };

    document.getElementById("statsSummary").innerText =
        `🔹 Aktiv: ${stats.Aktiv} | 🔸 Wechselbank: ${stats.Wechselbank} | ❌ Gebannt: ${stats.Gebannt}`;
}

// Manueller Discord-Push
pushButton.addEventListener("click", () => {
    sendToDiscord("📢 **Manueller Push der aktuellen Mitgliederliste:**");
});

// Initialisieren
loadMembers();
