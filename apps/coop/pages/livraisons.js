function init_livraisons() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-box"></i> Livraisons</h1>' +
            '<button class="btn btn-primary" onclick="showAddLivraison()"><i class="fas fa-plus"></i> Nouvelle livraison</button>' +
        '</div>' +
        '<div class="stats-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:14px;">' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-number" id="statAttente">0</div><div class="stat-label">En attente</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-truck"></i></div><div class="stat-info"><div class="stat-number" id="statCours">0</div><div class="stat-label">En cours</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-number" id="statLivrees">0</div><div class="stat-label">Livrées</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-times-circle"></i></div><div class="stat-info"><div class="stat-number" id="statAnnulees">0</div><div class="stat-label">Annulées</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-number" id="statCA">0 Ar</div><div class="stat-label">CA livraisons</div></div></div>' +
        '</div>' +
        '<div class="card"><table><thead><tr><th>N°</th><th>Type</th><th>Départ</th><th>Arrivée</th><th>Livreur</th><th>Prix</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="livraisonsTable"><tr><td colspan="8">Chargement...</td></tr></tbody></table></div>';
    loadLivraisons();
}

async function loadLivraisons() {
    try {
        var livraisons = await apiGet('/livraisons');
        var drivers = await apiGet('/drivers');
        
        var attente = 0, cours = 0, livrees = 0, annulees = 0, totalCA = 0;
        livraisons.forEach(function(l) {
            if (l.statut === 'en_attente') attente++;
            else if (l.statut === 'en_cours') cours++;
            else if (l.statut === 'livree') livrees++;
            else if (l.statut === 'annulee') annulees++;
            totalCA += l.prix || 0;
        });
        
        document.getElementById('statAttente').textContent = attente;
        document.getElementById('statCours').textContent = cours;
        document.getElementById('statLivrees').textContent = livrees;
        document.getElementById('statAnnulees').textContent = annulees;
        document.getElementById('statCA').textContent = totalCA.toLocaleString() + ' Ar';
        
        document.getElementById('livraisonsTable').innerHTML = livraisons.length ? livraisons.map(function(l) {
            var driver = drivers.find(function(d) { return d.id === l.driverId; });
            var driverName = driver && driver.user ? driver.user.name : 'Non assigné';
            var statutBadge = l.statut === 'en_attente' ? 'badge-warning' : l.statut === 'en_cours' ? 'badge-info' : l.statut === 'livree' ? 'badge-success' : 'badge-danger';
            var statutLabel = l.statut === 'en_attente' ? 'En attente' : l.statut === 'en_cours' ? 'En cours' : l.statut === 'livree' ? 'Livrée' : 'Annulée';
            var actions = '';
            if (l.statut === 'en_attente') actions += '<button class="btn-sm btn-info" onclick="updateStatut(\'' + l.id + '\',\'en_cours\')">Démarrer</button> ';
            if (l.statut === 'en_cours') actions += '<button class="btn-sm btn-success" onclick="updateStatut(\'' + l.id + '\',\'livree\')">Livrer</button> ';
            if (l.statut !== 'livree' && l.statut !== 'annulee') actions += '<button class="btn-sm btn-suspend" onclick="updateStatut(\'' + l.id + '\',\'annulee\')">Annuler</button>';
            
            return '<tr><td><code>#' + l.id.substring(0,6) + '</code></td>' +
                '<td>' + l.type + '</td>' +
                '<td>' + (l.adresseDepart || 'N/A') + '</td>' +
                '<td>' + (l.adresseArrivee || 'N/A') + '</td>' +
                '<td>' + driverName + '</td>' +
                '<td><strong>' + (l.prix || 0).toLocaleString() + ' Ar</strong></td>' +
                '<td><span class="badge ' + statutBadge + '">' + statutLabel + '</span></td>' +
                '<td class="action-btns">' + actions + '</td></tr>';
        }).join('') : '<tr><td colspan="8">Aucune livraison</td></tr>';
    } catch(e) { console.error(e); }
}

function showAddLivraison() {
    apiGet('/societes').then(function(societes) {
        apiGet('/drivers').then(function(drivers) {
            apiGet('/vehicles').then(function(vehicles) {
                var h = '<div class="form-group"><label>Société</label><select id="addSocieteId">';
                societes.forEach(function(s) { h += '<option value="' + s.id + '">' + s.name + '</option>'; });
                h += '</select></div>';
                h += '<div class="form-group"><label>Type</label><select id="addType"><option>colis</option><option>plats</option><option>courses</option><option>demenagement</option><option>documents</option></select></div>';
                h += '<div class="form-group"><label>Adresse départ</label><input id="addDepart"></div>';
                h += '<div class="form-group"><label>Adresse arrivée</label><input id="addArrivee"></div>';
                h += '<div class="form-group"><label>Livreur</label><select id="addDriver"><option value="">Non assigné</option>';
                drivers.forEach(function(d) { h += '<option value="' + d.id + '">' + (d.user ? d.user.name : d.driverCode) + '</option>'; });
                h += '</select></div>';
                h += '<div class="form-group"><label>Véhicule</label><select id="addVehicle"><option value="">Non assigné</option>';
                vehicles.forEach(function(v) { h += '<option value="' + v.id + '">' + v.plate + '</option>'; });
                h += '</select></div>';
                h += '<div class="form-group"><label>Prix (Ar)</label><input type="number" id="addPrix" value="0"></div>';
                h += '<div class="form-group"><label>Commission (Ar)</label><input type="number" id="addCommission" value="0"></div>';
                h += '<div class="form-group"><label>Description</label><textarea id="addDesc" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></textarea></div>';
                showModal('Nouvelle livraison', h, function() {
                    apiPost('/livraisons', {
                        societeId: document.getElementById('addSocieteId').value,
                        type: document.getElementById('addType').value,
                        adresseDepart: document.getElementById('addDepart').value,
                        adresseArrivee: document.getElementById('addArrivee').value,
                        driverId: document.getElementById('addDriver').value || null,
                        vehicleId: document.getElementById('addVehicle').value || null,
                        prix: document.getElementById('addPrix').value,
                        commission: document.getElementById('addCommission').value,
                        description: document.getElementById('addDesc').value
                    }).then(function() { closeModal(); loadLivraisons(); });
                });
            });
        });
    });
}

function updateStatut(id, statut) {
    apiPut('/livraisons/' + id, { statut: statut }).then(function() { loadLivraisons(); });
}
