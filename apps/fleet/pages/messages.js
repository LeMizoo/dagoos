function init_messages() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-envelope"></i> Messages</h1>' +
            '<button class="btn btn-primary" onclick="showNewMessage()"><i class="fas fa-plus"></i> Nouveau message</button>' +
        '</div>' +
        '<div class="card"><table><thead><tr><th>Date</th><th>Sujet</th><th>Message</th><th>Réponse</th><th>Statut</th></tr></thead><tbody id="messagesTable"><tr><td colspan="5">Chargement...</td></tr></tbody></table></div>';
    loadMessages();
    setInterval(loadMessages, 30000);
}

async function loadMessages() {
    try {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var orgs = await apiGet('/organizations');
        var org = orgs.find(function(o) { return o.email === user.email; });
        if (!org) return;
        
        var messages = await apiGet('/messages');
        var myMessages = messages.filter(function(m) { return m.organizationId === org.id; });
        
        document.getElementById('messagesTable').innerHTML = myMessages.length ? myMessages.reverse().map(function(m) {
            var statutBadge = m.replied ? 'badge-success' : 'badge-warning';
            var statutLabel = m.replied ? 'Répondu' : 'En attente';
            return '<tr><td style="font-size:11px;">' + new Date(m.createdAt).toLocaleString('fr-FR') + '</td>' +
                '<td><strong>' + m.subject + '</strong></td>' +
                '<td>' + (m.content || '').substring(0, 80) + '</td>' +
                '<td style="color:#27AE60;">' + (m.reply ? m.reply.substring(0, 60) : '-') + '</td>' +
                '<td><span class="badge ' + statutBadge + '">' + statutLabel + '</span></td></tr>';
        }).join('') : '<tr><td colspan="5">Aucun message</td></tr>';
    } catch(e) { console.error(e); }
}

function showNewMessage() {
    var h = '<div class="form-group"><label>Sujet *</label><input id="msgSubject"></div>';
    h += '<div class="form-group"><label>Type</label><select id="msgType"><option value="info">Information</option><option value="question">Question</option><option value="probleme">Problème</option><option value="urgent">Urgent</option></select></div>';
    h += '<div class="form-group"><label>Message *</label><textarea id="msgContent" rows="4" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></textarea></div>';
    showModal('Nouveau message', h, function() {
        var subject = document.getElementById('msgSubject').value;
        var content = document.getElementById('msgContent').value;
        if (!subject || !content) return alert('Sujet et message requis');
        apiGet('/organizations').then(function(orgs) {
            var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
            var org = orgs.find(function(o) { return o.email === user.email; });
            if (!org) return alert('Organisation non trouvée');
            apiPost('/messages', {
                organizationId: org.id,
                subject: subject,
                content: content,
                type: document.getElementById('msgType').value
            }).then(function() { closeModal(); loadMessages(); });
        });
    });
}
