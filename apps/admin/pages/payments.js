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
    
    // Orange Money
    h += '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">';
    h += '<h4 style="color:#F39C12;"><i class="fas fa-mobile-alt"></i> Orange Money</h4>';
    h += '<div class="form-group"><label>Actif</label><select id="om_actif" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Oui</option><option>Non</option></select></div>';
    h += '<div class="form-group"><label>Numero marchand</label><input id="om_num" value="0340000000" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>Frais (%)</label><input id="om_frais" value="1" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-sm btn-success" onclick="savePaymentConfig(\'om\')"><i class="fas fa-save"></i> Enregistrer</button><button class="btn-sm btn-suspend" onclick="resetPaymentConfig(\'om\')"><i class="fas fa-undo"></i> Annuler</button></div>';
    h += '</div>';
    
    // MVola
    h += '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">';
    h += '<h4 style="color:#27AE60;"><i class="fas fa-mobile-alt"></i> MVola</h4>';
    h += '<div class="form-group"><label>Actif</label><select id="mvola_actif" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Oui</option><option>Non</option></select></div>';
    h += '<div class="form-group"><label>Numero marchand</label><input id="mvola_num" value="0340000000" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>Frais (%)</label><input id="mvola_frais" value="1" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-sm btn-success" onclick="savePaymentConfig(\'mvola\')"><i class="fas fa-save"></i> Enregistrer</button><button class="btn-sm btn-suspend" onclick="resetPaymentConfig(\'mvola\')"><i class="fas fa-undo"></i> Annuler</button></div>';
    h += '</div>';
    
    // Airtel Money
    h += '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">';
    h += '<h4 style="color:#E74C3C;"><i class="fas fa-mobile-alt"></i> Airtel Money</h4>';
    h += '<div class="form-group"><label>Actif</label><select id="am_actif" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Oui</option><option>Non</option></select></div>';
    h += '<div class="form-group"><label>Numero marchand</label><input id="am_num" value="0340000000" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>Frais (%)</label><input id="am_frais" value="1" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-sm btn-success" onclick="savePaymentConfig(\'am\')"><i class="fas fa-save"></i> Enregistrer</button><button class="btn-sm btn-suspend" onclick="resetPaymentConfig(\'am\')"><i class="fas fa-undo"></i> Annuler</button></div>';
    h += '</div>';
    
    // Virement bancaire
    h += '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">';
    h += '<h4><i class="fas fa-university"></i> Virement bancaire</h4>';
    h += '<div class="form-group"><label>Actif</label><select id="bank_actif" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Oui</option><option>Non</option></select></div>';
    h += '<div class="form-group"><label>Banques acceptees</label><input id="bank_list" value="BFV, BNI, BOA, MCB" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>RIB</label><input id="bank_rib" value="00000-00000-00000" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-sm btn-success" onclick="savePaymentConfig(\'bank\')"><i class="fas fa-save"></i> Enregistrer</button><button class="btn-sm btn-suspend" onclick="resetPaymentConfig(\'bank\')"><i class="fas fa-undo"></i> Annuler</button></div>';
    h += '</div>';
    
    // Especes
    h += '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">';
    h += '<h4><i class="fas fa-money-bill-wave"></i> Paiement en especes</h4>';
    h += '<div class="form-group"><label>Nom du remettant</label><input id="cash_nom" placeholder="Nom complet" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>Numero de recu</label><input id="cash_recu" placeholder="N recu" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>Motifs</label><input id="cash_motif" placeholder="Motif du paiement" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div class="form-group"><label>Montant TTC (Ar)</label><input type="number" id="cash_montant" placeholder="0" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
    h += '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-sm btn-success" onclick="savePaymentConfig(\'cash\')"><i class="fas fa-save"></i> Enregistrer</button><button class="btn-sm btn-suspend" onclick="resetPaymentConfig(\'cash\')"><i class="fas fa-undo"></i> Annuler</button></div>';
    h += '</div>';
    
    h += '</div></div>';
    
    // Journal des transactions
    h += '<div class="card" style="padding:24px;margin-top:20px;"><h3><i class="fas fa-history"></i> Journal des transactions</h3>';
    h += '<table><thead><tr><th>Date</th><th>Organisation</th><th>Montant</th><th>Methode</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="transactionsTable">';
    h += '<tr><td colspan="6" style="text-align:center;color:var(--text2);">Aucune transaction pour le moment</td></tr>';
    h += '</tbody></table></div>';
    
    document.getElementById('mainInner').innerHTML = h;
    loadTransactions();
}

function savePaymentConfig(type) {
    alert('Configuration ' + type + ' enregistree !');
    // Log l'action
    addTransactionLog(type, 'Configuration sauvegardee');
}

function resetPaymentConfig(type) {
    if (confirm('Annuler les modifications pour ' + type + ' ?')) {
        alert('Modifications annulees pour ' + type);
    }
}

function addTransactionLog(type, action) {
    var table = document.getElementById('transactionsTable');
    if (!table) return;
    var now = new Date().toLocaleString('fr');
    var row = '<tr><td>' + now + '</td><td>Systeme</td><td>-</td><td>' + type + '</td><td><span class="badge badge-info">' + action + '</span></td><td><button class="btn-sm btn-view"><i class="fas fa-eye"></i></button></td></tr>';
    if (table.innerHTML.includes('Aucune transaction')) {
        table.innerHTML = row;
    } else {
        table.innerHTML = row + table.innerHTML;
    }
}

function loadTransactions() {
    var table = document.getElementById('transactionsTable');
    if (!table) return;
    var now = new Date().toLocaleString('fr');
    table.innerHTML = 
        '<tr><td>' + now + '</td><td>Systeme</td><td>-</td><td>Initialisation</td><td><span class="badge badge-success">OK</span></td><td><button class="btn-sm btn-view"><i class="fas fa-eye"></i></button></td></tr>';
}
