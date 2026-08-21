// ========================================
// DRIVER - NOTIFICATIONS
// ========================================

async function init_notifications() {
    var container =
        document.getElementById('mainContent') ||
        document.getElementById('pageContainer') ||
        document.querySelector('main');

    if (!container) return;

    container.innerHTML =
        getHeaderHTML() +
        '<div style="padding:16px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
            '<h2 style="font-size:20px;font-weight:bold;margin-bottom:16px;color:#DAA520;">🔔 Notifications</h2>' +
            '<div id="notificationsList" style="text-align:center;padding:40px;color:#94A3B8;">Chargement...</div>' +
        '</div>';

    try {
        var notifs = await window.apiGet('/notifications?read=false');
        var listEl = document.getElementById('notificationsList');
        
        if (!listEl) return;
        
        if (!Array.isArray(notifs) || notifs.length === 0) {
            listEl.innerHTML = '<p style="color:#94A3B8;text-align:center;padding:20px;">Aucune notification</p>';
            return;
        }
        
        listEl.innerHTML = notifs.map(function(n) {
            var title = n.title || 'Notification';
            var message = n.message || '';
            var dateStr = n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR') : '';
            
            return '<div style="background:#1E293B;border-radius:8px;padding:12px;margin-bottom:8px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">' +
                    '<div style="flex:1;">' +
                        '<div style="color:#fff;font-weight:600;font-size:13px;">' + title + '</div>' +
                        '<div style="color:#94A3B8;font-size:11px;margin-top:4px;">' + message + '</div>' +
                        '<div style="color:#64748B;font-size:10px;margin-top:4px;">' + dateStr + '</div>' +
                    '</div>' +
                    '<button onclick="marquerLueNotification(\'' + n.id + '\')" style="background:rgba(255,255,255,0.1);border:none;padding:4px 8px;border-radius:6px;color:#DAA520;cursor:pointer;font-size:10px;white-space:nowrap;">Marquer lue</button>' +
                '</div>' +
            '</div>';
        }).join('');
    } catch(e) {
        var listEl = document.getElementById('notificationsList');
        if (listEl) listEl.innerHTML = '<p style="color:#EF4444;">Erreur : ' + e.message + '</p>';
    }
}

async function marquerLueNotification(notificationId) {
    try {
        await window.apiFetch('/notifications/' + notificationId + '/read', {
            method: 'PUT'
        });
        init_notifications();
    } catch(e) {
        alert('Erreur : ' + e.message);
    }
}

window.init_notifications = init_notifications;
window.marquerLueNotification = marquerLueNotification;
