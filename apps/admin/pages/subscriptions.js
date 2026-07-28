function init_subscriptions() {
    document.getElementById('mainInner').innerHTML = `
        <div class="topbar"><h1>💳 Abonnements</h1></div>
        <div class="card"><table><thead><tr>
            <th>Organisation</th><th>Type</th><th>Plan</th><th>Prix/mois</th>
            <th>Début</th><th>Échéance</th><th>Statut</th><th>Actions</th>
        </tr></thead><tbody id="subsTable"></tbody></table></div>`;
    loadSubscriptions();
}

async function loadSubscriptions() {
    try {
        var orgs = await apiGet('/organizations');
        var plans = await apiGet('/plans');
        if (!Array.isArray(orgs)) orgs = [];
        if (!Array.isArray(plans)) plans = [];
        
        var planMap = {};
        plans.forEach(p => { planMap[p.type+'_'+p.name] = p; });
        
        document.getElementById('subsTable').innerHTML = orgs.length ? orgs.map(o => {
            var plan = planMap[o.type+'_'+(o.plan||'Freemium')] || {};
            var price = plan.price || 0;
            var typeIcon = o.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop';
            var start = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : 'N/A';
            
            // Échéance = début + 30 jours (simulé si pas dans l'API)
            var echeance = o.subscriptionEnd || o.subscriptionExpiresAt;
            var echDate = echeance ? new Date(echeance).toLocaleDateString('fr-FR') : new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('fr-FR');
            var isExpired = echeance ? new Date(echeance) < new Date() : false;
            var statusIcon = o.status === 'active' ? (isExpired ? '🔴' : '🟢') : o.status === 'pending' ? '🟡' : '⚫';
            var statusLabel = o.status === 'active' ? (isExpired ? 'Expiré' : 'Actif') : o.status === 'pending' ? 'En attente' : o.status;
            
            return '<tr>' +
                '<td><strong>' + o.name + '</strong><br><small>' + (o.email || '') + '</small></td>' +
                '<td>' + typeIcon + '</td>' +
                '<td><span class="badge badge-info">' + (o.plan || 'Freemium') + '</span></td>' +
                '<td>' + (price === 0 ? 'Gratuit' : price.toLocaleString() + ' Ar') + '</td>' +
                '<td>' + start + '</td>' +
                '<td style="color:' + (isExpired ? '#E74C3C' : '#27AE60') + '">' + echDate + '</td>' +
                '<td>' + statusIcon + ' ' + statusLabel + '</td>' +
                '<td>' +
                    '<button class="btn-sm btn-edit" onclick="changePlan(\''+o.id+'\',\''+(o.plan||'Freemium')+'\',\''+o.type+'\')">✏️ Plan</button>' +
                    (o.status==='active' ? '<button class="btn-sm" onclick="renewSub(\''+o.id+'\')">🔄 Renouveler</button>' : '') +
                '</td>' +
            '</tr>';
        }).join('') : '<tr><td colspan="8">Aucun abonnement</td></tr>';
    } catch(e) {
        document.getElementById('subsTable').innerHTML = '<tr><td colspan="8">❌ Erreur</td></tr>';
    }
}

function changePlan(orgId, currentPlan, type) {
    var plans = type === 'FLEET_MANAGER' 
        ? ['Freemium','Basic','Standard','Premium']
        : ['Freemium','Basic','Standard','Premium'];
    
    var h = '<h4>Changer le plan</h4>';
    h += '<select id="newPlan" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:8px;">';
    plans.forEach(p => {
        h += '<option value="'+p+'" '+(p===currentPlan?'selected':'')+'>'+p+'</option>';
    });
    h += '</select>';
    h += '<button class="btn btn-primary" onclick="savePlan(\''+orgId+'\')">💾 Enregistrer</button>';
    showModal('Changer le plan', h);
}

async function savePlan(orgId) {
    var plan = document.getElementById('newPlan').value;
    try {
        await apiPatch('/organizations/'+orgId, { plan: plan });
        closeModal();
        loadSubscriptions();
    } catch(e) { alert('❌ Erreur'); }
}

async function renewSub(orgId) {
    if (!confirm('Renouveler pour 30 jours ?')) return;
    try {
        await apiPost('/organizations/'+orgId+'/renew', {});
        loadSubscriptions();
        alert('✅ Abonnement renouvelé !');
    } catch(e) { alert('❌ Erreur'); }
}
