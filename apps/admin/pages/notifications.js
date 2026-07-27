function init_notifications() {
    document.getElementById('mainInner').innerHTML = 
        '<div class="topbar"><h1>🔔 Notifications</h1>' +
        '<button class="btn btn-sm btn-primary" onclick="marquerToutLu()"><i class="fas fa-check-double"></i> Tout marquer comme lu</button></div>' +
        
        '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;">' +
            '<div class="stat-card"><div class="stat-icon red">🔔</div><div class="stat-info"><div class="stat-number" id="statNonLu">0</div><div class="stat-label">Non lues</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon green">✅</div><div class="stat-info"><div class="stat-number" id="statLu">0</div><div class="stat-label">Lues</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-archive"></i></div><div class="stat-info"><div class="stat-number" id="statTotal">0</div><div class="stat-label">Total</div></div></div>' +
            
        '<div class="card"><div id="notificationsList" style="padding:0 16px;max-height:500px;overflow-y:auto;"></div></div>';
    loadNotifications();
    setInterval(loadNotifications, 30000);
}

var notificationsData = [];

async function loadNotifications() {
    try {
        var logs = await apiGet('/logs');
        var messages = await apiGet('/messages');
        var orgs = await apiGet('/organizations');
        
        // Construire les notifications à partir des logs et messages
        notificationsData = [];
        
        // Messages non lus
        var unreadMessages = messages.filter(function(m) { return !m.read; });
        unreadMessages.forEach(function(m) {
            var org = orgs.find(function(o) { return o.id === m.organizationId; });
            notificationsData.push({
                id: 'msg-' + m.id,
                type: 'message',
                icon: 'envelope',
                color: '#3498DB',
                title: 'Nouveau message de ' + (org ? org.name : 'Admin'),
                detail: m.subject,
                date: m.createdAt,
                read: m.read
            });
        });
        
        // Nouvelles inscriptions
        var newOrgs = orgs.filter(function(o) { return o.status === 'pending'; });
        newOrgs.forEach(function(o) {
            notificationsData.push({
                id: 'org-' + o.id,
                type: 'inscription',
                icon: 'user-plus',
                color: '#F39C12',
                title: 'Nouvelle inscription : ' + o.name,
                detail: 'Plan ' + (o.plan || 'Freemium') + ' - En attente de validation',
                date: o.createdAt,
                read: false
            });
        });
        
        // Logs récents
        logs.slice(0, 10).forEach(function(l) {
            notificationsData.push({
                id: 'log-' + l.id,
                type: 'log',
                icon: 'history',
                color: '#6C757D',
                title: l.action,
                detail: l.details || '',
                date: l.createdAt,
                read: true
            });
        });
        
        // Trier par date
        notificationsData.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
        
        renderNotifications();
    } catch(e) { console.error(e); }
}

function renderNotifications() {
    var nonLu = notificationsData.filter(function(n) { return !n.read; }).length;
    var lu = notificationsData.filter(function(n) { return n.read; }).length;
    
    document.getElementById('statNonLu').textContent = nonLu;
    document.getElementById('statLu').textContent = lu;
    document.getElementById('statTotal').textContent = notificationsData.length;
    document.getElementById('msgCount').textContent = nonLu;
    
    var html = '';
    notificationsData.forEach(function(n) {
        var bg = n.read ? '' : 'background:#FEF3C7;';
        html += '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);' + bg + '">' +
            '<div style="width:36px;height:36px;border-radius:50%;background:' + n.color + '20;color:' + n.color + ';display:flex;align-items:center;justify-content:center;font-size:16px;">' +
                '<i class="fas fa-' + n.icon + '"></i>' +
            '</div>' +
            '<div style="flex:1;">' +
                '<div style="font-weight:600;font-size:13px;">' + n.title + '</div>' +
                '<div style="font-size:11px;color:var(--text2);">' + n.detail + '</div>' +
                '<div style="font-size:10px;color:var(--text2);">' + new Date(n.date).toLocaleString('fr-FR') + '</div>' +
            '</div>' +
            (!n.read ? '<button class="btn-sm btn-view" onclick="marquerLu(\'' + n.id + '\')">✅</button>' : '') +
        '</div>';
    });
    
    document.getElementById('notificationsList').innerHTML = html || '<p style="text-align:center;color:var(--text2);padding:30px;">Aucune notification</p>';
}

function marquerLu(id) {
    var n = notificationsData.find(function(x) { return x.id === id; });
    if (n) { n.read = true; renderNotifications(); }
}

function marquerToutLu() {
    notificationsData.forEach(function(n) { n.read = true; });
    renderNotifications();
}
