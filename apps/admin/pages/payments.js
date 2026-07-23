function init_payments() {
    var h = '';
    h += '<div class="topbar"><h1><i class="fas fa-coins"></i> Paiements</h1></div>';
    
    // Stats
    h += '<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px;">';
    h += '<div class="stat-card" style="background:#FEF3C7;"><div class="stat-icon" style="font-size:24px;">📱</div><div class="stat-info"><div class="stat-number" style="color:#F39C12;" id="statOM">0 Ar</div><div class="stat-label">Orange Money</div></div></div>';
    h += '<div class="stat-card" style="background:#D1FAE5;"><div class="stat-icon" style="font-size:24px;">📱</div><div class="stat-info"><div class="stat-number" style="color:#27AE60;" id="statMVola">0 Ar</div><div class="stat-label">MVola</div></div></div>';
    h += '<div class="stat-card" style="background:#FEE2E2;"><div class="stat-icon" style="font-size:24px;">📱</div><div class="stat-info"><div class="stat-number" style="color:#E74C3C;" id="statAM">0 Ar</div><div class="stat-label">Airtel Money</div></div></div>';
    h += '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-money-bill-wave"></i></div><div class="stat-info"><div class="stat-number" id="statCash">0 Ar</div><div class="stat-label">Especes</div></div></div>';
    h += '</div>';
    
    // Configuration
    h += '<div class="card" style="padding:24px;"><h3><i class="fas fa-cog"></i> Configuration des paiements</h3>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">';
    
    var methods = [
        { id: 'om', label: 'Orange Money', color: '#F39C12', icon: 'fa-mobile-alt' },
        { id: 'mvola', label: 'MVola', color: '#27AE60', icon: 'fa-mobile-alt' },
        { id: 'am', label: 'Airtel Money', color: '#E74C3C', icon: 'fa-mobile-alt' },
        { id: 'bank', label: 'Virement bancaire', color: '#1A5276', icon: 'fa-university' }
    ];
    
    methods.forEach(function(m) {
        h += '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">';
        h += '<h4 style="color:' + m.color + ';"><i class="fas ' + m.icon + '"></i> ' + m.label + '</h4>';
        h += '<div class="form-group"><label>Actif</label><select id="' + m.id + '_actif" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Oui</option><option>Non</option></select></div>';
        h += '<div class="form-group"><label>Numero marchand</label><input id="' + m.id + '_num" value="0340000000" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
        h += '<div class="form-group"><label>Frais (%)</label><input id="' + m.id + '_frais" value="1" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
        h += '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-sm btn-success" onclick="savePayment(\'' + m.id + '\')"><i class="fas fa-save"></i> Enregistrer</button></div>';
        h += '</div>';
    });
    
    // Especes
    h += '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">';
    h += '<h4><i class="fas fa-money-bill-wave"></i> Paiement en especes</h4>';
    h += '<div class="form-group"><label>Organisation</label><select id="cash_org" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Selectionner...</option></select></div>';
    h += '<div class="form-group"><label>Nom du remettant</label><input id="cash_nom" placeholder="Nom complet" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>Numero de recu</label><input id="cash_recu" placeholder="N recu" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>Motifs</label><input id="cash_motif" placeholder="Motif du paiement" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>Montant TTC (Ar)</label><input type="number" id="cash_montant" placeholder="0" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-sm btn-success" onclick="savePayment(\'cash\')"><i class="fas fa-save"></i> Enregistrer</button></div>';
    h += '</div>';
    
    h += '</div></div>';
    
    // Journal des transactions
    h += '<div class="card" style="padding:24px;margin-top:20px;"><h3><i class="fas fa-history"></i> Journal des transactions</h3>';
    h += '<table><thead><tr><th>Date</th><th>Organisation</th><th>Montant</th><th>Methode</th><th>Actions</th></tr></thead><tbody id="transactionsTable">';
    h += '<tr><td colspan="5" style="text-align:center;color:var(--text2);">Chargement...</td></tr>';
    h += '</tbody></table></div>';
    
    document.getElementById('mainInner').innerHTML = h;
    loadTransactions();
    loadOrganizations();
}

async function loadOrganizations() {
    try {
        var orgs = await apiGet('/organizations');
        var sel = document.getElementById('cash_org');
        if (sel) {
            orgs.forEach(function(o) {
                var opt = document.createElement('option');
                opt.value = o.id;
                opt.textContent = o.name;
                sel.appendChild(opt);
            });
        }
    } catch(e) {}
}

function savePayment(type) {
    var data = { type: type, methode: type };
    if (type === 'cash') {
        data.organisation = document.getElementById('cash_org').value;
        data.details = {
            nom: document.getElementById('cash_nom').value,
            recu: document.getElementById('cash_recu').value,
            motif: document.getElementById('cash_motif').value,
            montant: document.getElementById('cash_montant').value
        };
        data.montant = document.getElementById('cash_montant').value;
    } else {
        data.details = { config: 'sauvegardee' };
        data.montant = 0;
    }
    
    apiPost('/transactions', data).then(function() {
        alert('Paiement enregistre !');
        loadTransactions();
        if (type === 'cash') {
            document.getElementById('cash_nom').value = '';
            document.getElementById('cash_recu').value = '';
            document.getElementById('cash_motif').value = '';
            document.getElementById('cash_montant').value = '';
        }
    }).catch(function() { alert('Erreur'); });
}

async function loadTransactions() {
    try {
        var tx = await apiGet('/transactions');
        var table = document.getElementById('transactionsTable');
        if (!table) return;
        if (tx && tx.length > 0) {
            table.innerHTML = tx.map(function(t) {
                var details = {};
                try { details = JSON.parse(t.details || '{}'); } catch(e) {}
                var montant = details.montant || 0;
                var org = details.organisation || 'Systeme';
                var methode = t.action.replace('PAYMENT_', '');
                var badgeColor = methode === 'cash' ? 'badge-success' : 'badge-info';
                return '<tr><td>' + new Date(t.createdAt).toLocaleString('fr') + '</td><td>' + org + '</td><td>' + montant + ' Ar</td><td><span class="badge ' + badgeColor + '">' + methode + '</span></td><td><button class="btn-sm btn-view" onclick="viewTransaction(\'' + t.id + '\')"><i class="fas fa-eye"></i></button></td></tr>';
            }).join('');
        } else {
            table.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text2);">Aucune transaction</td></tr>';
        }
    } catch(e) {
        document.getElementById('transactionsTable').innerHTML = '<tr><td colspan="5">Erreur de chargement</td></tr>';
    }
}

function viewTransaction(id) {
    apiGet('/logs').then(function(logs) {
        var t = logs.find(function(l) { return l.id === id; });
        if (!t) return;
        var details = {};
        try { details = JSON.parse(t.details || '{}'); } catch(e) {}
        var info = '<p><strong>Date:</strong> ' + new Date(t.createdAt).toLocaleString('fr') + '</p>';
        info += '<p><strong>Type:</strong> ' + t.action + '</p>';
        if (details.montant) info += '<p><strong>Montant:</strong> ' + details.montant + ' Ar</p>';
        if (details.nom) info += '<p><strong>Remettant:</strong> ' + details.nom + '</p>';
        if (details.recu) info += '<p><strong>Recu:</strong> ' + details.recu + '</p>';
        if (details.motif) info += '<p><strong>Motif:</strong> ' + details.motif + '</p>';
        showModal('Transaction', info);
    });
}
