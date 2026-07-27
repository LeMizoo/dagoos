function init_messages() {
    var main = document.getElementById('mainInner');
    main.innerHTML = '<div class="topbar"><h1>📧 Messages</h1></div><div class="card"><table><thead><tr><th>De</th><th>Sujet</th><th>Date</th></tr></thead><tbody id="messagesTable"></tbody></table></div>';
    loadMessages();
}

async function loadMessages() {
    try {
        var msgs = await apiGet('/messages');
        document.getElementById('messagesTable').innerHTML = msgs.map(function(m) {
            return '<tr><td>' + (m.organization ? m.organization.name : 'Admin') + '</td><td>' + m.subject + '</td><td>' + new Date(m.createdAt).toLocaleString('fr') + '</td></tr>';
        }).join('') || '<tr><td colspan="3">Aucun message</td></tr>';
    } catch(e) {}
}
