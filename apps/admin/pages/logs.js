function init_logs() {
    var main = document.getElementById('mainInner');
    main.innerHTML = '<div class="topbar"><h1><i class="fas fa-clipboard-list"></i> Logs</h1></div><div class="card"><table><thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th></tr></thead><tbody id="logsTable"></tbody></table></div>';
    loadLogs();
}

async function loadLogs() {
    try {
        var logs = await apiGet('/logs');
        document.getElementById('logsTable').innerHTML = logs.slice(0, 50).map(function(l) {
            return '<tr><td>' + new Date(l.createdAt).toLocaleString('fr') + '</td><td>' + (l.userId || 'Système') + '</td><td>' + l.action + '</td></tr>';
        }).join('') || '<tr><td colspan="3">Aucun log</td></tr>';
    } catch(e) {}
}
