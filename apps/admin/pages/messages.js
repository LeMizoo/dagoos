function init_messages() {
    document.getElementById('mainInner').innerHTML = `
        <div class="topbar">
            <h1>📧 Messages</h1>
            <button class="btn btn-primary btn-sm" onclick="newMessage()">➕ Nouveau message</button>
        </div>
        <div class="card" style="margin-bottom:12px;padding:12px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <select id="msgFilter" onchange="loadMessages()" style="padding:8px;border-radius:6px;border:1px solid var(--border);font-size:13px;">
                    <option value="all">📬 Tous</option>
                    <option value="unread">🔵 Non lus</option>
                    <option value="read">✅ Lus</option>
                    <option value="archived">📁 Archivés</option>
                    <option value="deleted">🗑️ Corbeille</option>
                </select>
                <select id="msgType" onchange="loadMessages()" style="padding:8px;border-radius:6px;border:1px solid var(--border);font-size:13px;">
                    <option value="all">👥 Tous</option>
                    <option value="FLEET_MANAGER">🚛 Flottes</option>
                    <option value="COOPERATIVE">🏢 Coops</option>
                    <option value="DRIVER">🛵 Chauffeurs</option>
                </select>
                <input type="text" id="msgSearch" placeholder="🔍 Rechercher..." oninput="loadMessages()" style="padding:8px;border-radius:6px;border:1px solid var(--border);font-size:13px;flex:1;min-width:150px;">
                <button class="btn btn-sm" onclick="markAllRead()">✅ Tout lire</button>
            </div>
        </div>
        <div class="card">
            <table><thead><tr><th>De</th><th>Destinataire</th><th>Sujet</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody id="messagesTable"></tbody></table>
        </div>`;
    loadMessages();
}

async function loadMessages() {
    var filter = document.getElementById('msgFilter')?.value || 'all';
    var type = document.getElementById('msgType')?.value || 'all';
    var search = (document.getElementById('msgSearch')?.value || '').toLowerCase();
    try {
        var msgs = await apiGet('/messages');
        if (!Array.isArray(msgs)) msgs = [];
        if (filter === 'unread') msgs = msgs.filter(m => !m.read);
        if (filter === 'read') msgs = msgs.filter(m => m.read);
        if (filter === 'archived') msgs = msgs.filter(m => m.archived);
        if (filter === 'deleted') msgs = msgs.filter(m => m.deleted);
        if (filter !== 'deleted') msgs = msgs.filter(m => !m.deleted);
        if (type !== 'all') msgs = msgs.filter(m => m.recipientType === type);
        if (search) msgs = msgs.filter(m => (m.subject||'').toLowerCase().includes(search) || (m.content||'').toLowerCase().includes(search));
        msgs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        document.getElementById('messagesTable').innerHTML = msgs.length ? msgs.map(m => {
            var d = new Date(m.createdAt).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
            var icon = m.deleted?'🗑️':m.archived?'📁':m.read?'✅':'🔵';
            var label = m.recipientType==='FLEET_MANAGER'?'🚛 Flotte':m.recipientType==='COOPERATIVE'?'🏢 Coop':m.recipientType==='DRIVER'?'🛵 Chauffeur':m.recipientName||'Tous';
            var style = m.read?'':'style="font-weight:600;"';
            var act = '';
            if (!m.deleted && !m.archived) {
                act += '<button class="btn-sm btn-view" onclick="viewMsg(\''+m.id+'\')">👁</button>';
                if (!m.read) act += '<button class="btn-sm" onclick="markRead(\''+m.id+'\')">✅</button>';
                act += '<button class="btn-sm" onclick="archiveMsg(\''+m.id+'\')">📁</button>';
            }
            if (!m.deleted) act += '<button class="btn-sm" onclick="deleteMsg(\''+m.id+'\')">🗑️</button>';
            else act += '<button class="btn-sm" onclick="restoreMsg(\''+m.id+'\')">🔄</button>';
            return '<tr '+style+'><td>'+(m.sender||'Système')+'</td><td>'+label+'</td><td>'+(m.subject||'Sans sujet')+'</td><td>'+d+'</td><td>'+icon+'</td><td class="action-btns">'+act+'</td></tr>';
        }).join('') : '<tr><td colspan="6">📭 Aucun message</td></tr>';
    } catch(e) { document.getElementById('messagesTable').innerHTML = '<tr><td colspan="6">❌ Erreur</td></tr>'; }
}

function newMessage() {
    var h = '<h4>➕ Nouveau message</h4>';
    h += '<select id="newType" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:8px;"><option value="all">📢 Tous</option><option value="FLEET_MANAGER">🚛 Flottes</option><option value="COOPERATIVE">🏢 Coops</option><option value="DRIVER">🛵 Chauffeurs</option></select>';
    h += '<input id="newSubject" placeholder="Sujet" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:8px;">';
    h += '<textarea id="newContent" rows="5" placeholder="Message..." style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:8px;"></textarea>';
    h += '<button class="btn btn-primary" onclick="sendMsg()">📤 Envoyer</button>';
    showModal('Nouveau message', h);
}

async function sendMsg() {
    var t = document.getElementById('newType').value;
    var s = document.getElementById('newSubject').value.trim();
    var c = document.getElementById('newContent').value.trim();
    if (!s || !c) return alert('Sujet et message requis');
    try { await apiPost('/messages',{recipientType:t==='all'?null:t,subject:s,content:c}); closeModal(); loadMessages(); } catch(e) { alert('❌ Erreur'); }
}
async function markRead(id) { try { await apiPatch('/messages/'+id,{read:true}); loadMessages(); } catch(e) {} }
async function markAllRead() { if(confirm('Tout marquer lu ?')) { try { await apiPost('/messages/read-all',{}); loadMessages(); } catch(e) {} } }
async function archiveMsg(id) { if(confirm('Archiver ?')) { try { await apiPatch('/messages/'+id,{archived:true}); loadMessages(); } catch(e) {} } }
async function deleteMsg(id) { if(confirm('Supprimer ?')) { try { await apiPatch('/messages/'+id,{deleted:true}); loadMessages(); } catch(e) {} } }
async function restoreMsg(id) { try { await apiPatch('/messages/'+id,{deleted:false}); loadMessages(); } catch(e) {} }
async function viewMsg(id) {
    try {
        var msgs = await apiGet('/messages'); var m = msgs.find(x=>x.id===id); if(!m) return;
        if(!m.read) markRead(id);
        showModal(m.subject||'Message','<p><strong>De:</strong> '+(m.sender||'Système')+'</p><p><strong>Date:</strong> '+new Date(m.createdAt).toLocaleString('fr-FR')+'</p><hr><p>'+(m.content||'')+'</p>');
    } catch(e) {}
}
