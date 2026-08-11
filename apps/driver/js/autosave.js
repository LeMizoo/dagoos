// DAGOO'S - AUTOSAVE - Sauvegarde avant fermeture
// À inclure dans tous les dashboards

// Sauvegarder les données en cours avant de quitter
window.addEventListener('beforeunload', function() {
    // Sauvegarder l'état actuel
    var state = {
        page: localStorage.getItem('dago_current_page') || 'home',
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('dago_last_state', JSON.stringify(state));
});

// Restaurer l'état au chargement
window.addEventListener('DOMContentLoaded', function() {
    var lastState = localStorage.getItem('dago_last_state');
    if (lastState) {
        try {
            var state = JSON.parse(lastState);
            console.log('📂 État restauré:', state.page);
        } catch(e) {}
    }
});

// Notifier l'API des changements non sauvegardés
function notifyChanges(type, data) {
    var pending = JSON.parse(localStorage.getItem('dago_pending_changes') || '[]');
    pending.push({ type: type, data: data, time: new Date().toISOString() });
    localStorage.setItem('dago_pending_changes', JSON.stringify(pending));
}

// Synchroniser les changements en attente
async function syncPendingChanges() {
    var pending = JSON.parse(localStorage.getItem('dago_pending_changes') || '[]');
    if (pending.length === 0) return;
    
    var token = localStorage.getItem('dagoo_driver_token');
    if (!token) return;
    
    for (var change of pending) {
        try {
            await fetch(DAGOOS_CONFIG.apiUrl + change.type, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(change.data)
            });
        } catch(e) {
            console.error('Sync failed:', e);
        }
    }
    
    localStorage.removeItem('dago_pending_changes');
    console.log('✅ Changements synchronisés');
}

// Sync toutes les 30 secondes
setInterval(syncPendingChanges, 30000);

// Sync avant de quitter
window.addEventListener('beforeunload', syncPendingChanges);
