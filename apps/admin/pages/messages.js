function init_messages() {
    document.getElementById('mainInner').innerHTML = `
        <div class="topbar"><h1>📧 Messages</h1>
            <button class="btn btn-primary btn-sm" onclick="newMessage()">➕ Nouveau message</button>
        </div>
        <div class="card" style="margin-bottom:12px;padding:12px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <select id="msgDir" onchange="loadMessages()" style="padding:8px;border-radius:6px;border:1px solid var(--border);font-size:13px;">
                    <option value="all">📬 Tous (reçus + envoyés)</option>
                    <option value="received">📥 Reçus</option>
                    <option value="sent">📤 Envoyés</option>
                </select>
                <select id="msgFilter" onchange="loadMessages()" style="padding:8px;border-radius:6px;border:1px solid var(--border);font-size:13px;">
                    <option value="all">📋 Tous</option>
                    <option value="unread">🔵 Non lus</option>
                    <option value="read">✅ Lus</option>
                </select>
                <input type="text" id="msgSearch" placeholder="🔍 Rechercher..." oninput="loadMessages()" style="padding:8px;border-radius:6px;border:1px solid var(--border);font-size:13px;flex:1;min-width:150px;">
                <button class="btn btn-sm" onclick="markAllRead()">✅ Tout lire</button>
            </div>
        </div>
        <div class="card">
            <table><thead><tr><th>Direction</th><th>De</th><th>Destinataire</th><th>Sujet</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody id="messagesTable"></tbody></table>
        </div>`;
    loadMessages();
}

async function loadMessages() {
    var dir = document.getElementById('msgDir')?.value || 'all';
    var filter = document.getElementById('msgFilter')?.value || 'all';
    var search = (document.getElementById('msgSearch')?.value || '').toLowerCase();
    try {
        var msgs = await apiGet('/messages');
        if (!Array.isArray(msgs)) msgs = [];
        
        msgs = msgs.map(function(m) {
            m._direction = m.sender === 'Admin' ? '📤 Envoyé' : '📥 Reçu';
            return m;
        });
        
        if (dir === 'received') msgs = msgs.filter(function(m) { return m._direction === '📥 Reçu'; });
        if (dir === 'sent') msgs = msgs.filter(function(m) { return m._direction === '📤 Envoyé'; });
        if (filter === 'unread') msgs = msgs.filter(function(m) { return !m.read; });
        if (filter === 'read') msgs = msgs.filter(function(m) { return m.read; });
        if (search) msgs = msgs.filter(function(m) { 
            return (m.subject||'').toLowerCase().includes(search) || 
                   (m.content||'').toLowerCase().includes(search) ||
                   (m.sender||'').toLowerCase().includes(search); 
        });
        
        msgs.sort(function(a,b) { return new Date(b.createdAt) - new Date(a.createdAt); });
        
        document.getElementById('messagesTable').innerHTML = msgs.length ? msgs.map(function(m) {
            var d = new Date(m.createdAt).toLocaleString('fr-FR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
            var icon = m.read ? '✅' : '🔵';
            var label = m.organization ? m.organization.name : 'Tous';
            var style = m.read ? '' : 'style="font-weight:600;"';
            var act = '<button class="btn-sm btn-view" onclick="viewMsg(\''+m.id+'\')">👁</button>';
            if (!m.read) act += '<button class="btn-sm" onclick="markRead(\''+m.id+'\')">✅</button>';
            
            return '<tr '+style+'><td>'+m._direction+'</td><td>'+(m.sender||'Système')+'</td><td>'+label+'</td><td>'+(m.subject||'Sans sujet')+'</td><td>'+d+'</td><td>'+icon+'</td><td class="action-btns">'+act+'</td></tr>';
        }).join('') : '<tr><td colspan="7">📭 Aucun message</td></tr>';
    } catch(e) { document.getElementById('messagesTable').innerHTML = '<tr><td colspan="7">❌ Erreur</td></tr>'; }
}

function newMessage() {
    var h = "";
    h += "<label style="font-size:13px;font-weight:500;margin-bottom:4px;display:block;">Destinataire</label>";
    h += "<select id="newRecipient" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:10px;">";
    h += "<option value="all">📢 Toutes les organisations</option>";
    h += "<option value="FLEET_MANAGER">🚛 Flotte</option>";
    h += "<option value="COOPERATIVE">🏢 Coop</option>";
    h += "<option value="DRIVER">🛵 Chauffeur</option>";
    h += "</select>";
    h += "<label style="font-size:13px;font-weight:500;margin-bottom:4px;display:block;">Type</label>";
    h += "<select id="newType" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:10px;">";
    h += "<option value="info">ℹ️ Information</option>";
    h += "<option value="warning">⚠️ Avertissement</option>";
    h += "<option value="success">✅ Succès</option>";
    h += "<option value="error">❌ Urgent</option>";
    h += "</select>";
    h += "<input id="newSubject" placeholder="Sujet du message" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:10px;">";
    h += "<textarea id="newContent" rows="5" placeholder="Contenu du message..." style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:10px;"></textarea>";
    h += "<div style="display:flex;gap:8px;">";
    h += "<button class="btn" onclick="closeModal()" style="flex:1;background:var(--border);">Annuler</button>";
    h += "<button class="btn btn-primary" onclick="sendMsg()" style="flex:1;">📤 Envoyer le message</button>";
    h += "</div>";
    showModal("Nouveau message", h);
}

async function sendMsg() {
    var recipientId = document.getElementById('newRecipient').value;
    var type = document.getElementById('newType').value;
    var s = document.getElementById('newSubject').value.trim();
    var c = document.getElementById('newContent').value.trim();
    if (!s || !c) return alert('Sujet et message requis');
    try { 
        await apiPost('/messages', { 
            organizationId: recipientId === 'all' ? null : recipientId, 
            subject: s, 
            content: c, 
            type: type 
        }); 
        closeModal(); 
        loadMessages(); 
    } catch(e) { alert('❌ Erreur: ' + e.message); }
}

async function markRead(id) { 
    try { await apiPut('/messages/' + id + '/read', {}); loadMessages(); } catch(e) {} 
}

async function markAllRead() { 
    if (!confirm('Tout marquer comme lu ?')) return;
    try { 
        var msgs = await apiGet('/messages');
        for (var i = 0; i < msgs.length; i++) {
            if (!msgs[i].read) await apiPut('/messages/' + msgs[i].id + '/read', {});
        }
        loadMessages(); 
    } catch(e) {} 
}

async function viewMsg(id) {
    try {
        var msgs = await apiGet('/messages'); 
        var m = msgs.find(function(x) { return x.id === id; }); 
        if (!m) return;
        if (!m.read) markRead(id);
        showModal(m.subject || 'Message', 
            '<p><strong>De:</strong> '+(m.sender||'Système')+'</p>' +
            '<p><strong>Pour:</strong> '+(m.organization ? m.organization.name : 'Tous')+'</p>' +
            '<p><strong>Date:</strong> '+new Date(m.createdAt).toLocaleString('fr-FR')+'</p>' +
            '<hr><p>'+(m.content||'')+'</p>');
    } catch(e) {}
}
