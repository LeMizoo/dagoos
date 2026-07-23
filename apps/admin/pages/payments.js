function init_payments() {
    document.getElementById('mainInner').innerHTML = 
        '<div class="topbar"><h1><i class="fas fa-coins"></i> Paiements</h1></div>' +
        
        '<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px;">' +
            '<div class="stat-card" style="background:#FEF3C7;"><div class="stat-icon" style="font-size:24px;">📱</div><div class="stat-info"><div class="stat-number" style="color:#F39C12;">0 Ar</div><div class="stat-label">Orange Money</div></div></div>' +
            '<div class="stat-card" style="background:#D1FAE5;"><div class="stat-icon" style="font-size:24px;">📱</div><div class="stat-info"><div class="stat-number" style="color:#27AE60;">0 Ar</div><div class="stat-label">MVola</div></div></div>' +
            '<div class="stat-card" style="background:#FEE2E2;"><div class="stat-icon" style="font-size:24px;">📱</div><div class="stat-info"><div class="stat-number" style="color:#E74C3C;">0 Ar</div><div class="stat-label">Airtel Money</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-money-bill-wave"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Especes</div></div></div>' +
        '</div>' +
        
        '<div class="card" style="padding:24px;">' +
            '<h3><i class="fas fa-cog"></i> Configuration des paiements</h3>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">' +
                '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">' +
                    '<h4 style="color:#F39C12;"><i class="fas fa-mobile-alt"></i> Orange Money</h4>' +
                    '<div class="form-group"><label>Actif</label><select style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Oui</option><option>Non</option></select></div>' +
                    '<div class="form-group"><label>Numero marchand</label><input value="0340000000" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
                    '<div class="form-group"><label>Frais (%)</label><input value="1" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
                '</div>' +
                '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">' +
                    '<h4 style="color:#27AE60;"><i class="fas fa-mobile-alt"></i> MVola</h4>' +
                    '<div class="form-group"><label>Actif</label><select style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Oui</option><option>Non</option></select></div>' +
                    '<div class="form-group"><label>Numero marchand</label><input value="0340000000" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
                    '<div class="form-group"><label>Frais (%)</label><input value="1" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
                '</div>' +
                '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">' +
                    '<h4 style="color:#E74C3C;"><i class="fas fa-mobile-alt"></i> Airtel Money</h4>' +
                    '<div class="form-group"><label>Actif</label><select style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Oui</option><option>Non</option></select></div>' +
                    '<div class="form-group"><label>Numero marchand</label><input value="0340000000" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
                    '<div class="form-group"><label>Frais (%)</label><input value="1" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
                '</div>' +
                '<div style="border:1px solid var(--border);border-radius:10px;padding:16px;">' +
                    '<h4><i class="fas fa-university"></i> Virement bancaire</h4>' +
                    '<div class="form-group"><label>Actif</label><select style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"><option>Oui</option><option>Non</option></select></div>' +
                    '<div class="form-group"><label>Banques acceptees</label><input value="BFV, BNI, BOA, MCB" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
                    '<div class="form-group"><label>RIB</label><input value="00000-00000-00000" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
                '</div>' +
            '</div>' +
            '<button onclick="alert(\'Configuration sauvegardee !\')" style="width:100%;padding:14px;background:#1A5276;color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-top:20px;"><i class="fas fa-save"></i> Enregistrer la configuration</button>' +
        '</div>' +
        
        '<div class="card" style="padding:24px;margin-top:20px;">' +
            '<h3><i class="fas fa-history"></i> Dernieres transactions</h3>' +
            '<table><thead><tr><th>Date</th><th>Organisation</th><th>Montant</th><th>Methode</th><th>Statut</th></tr></thead><tbody>' +
                '<tr><td colspan="5" style="text-align:center;color:var(--text2);">Aucune transaction pour le moment</td></tr>' +
            '</tbody></table>' +
        '</div>';
}
