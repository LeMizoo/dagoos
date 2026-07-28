function init_finances() {
    document.getElementById('mainInner').innerHTML = `
        <div class="topbar"><h1>💰 Finances</h1></div>
        <div class="card" style="margin-bottom:12px;padding:16px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;">
                <div><div style="font-size:24px;font-weight:800;color:#1A5276;" id="totalRevenue">0 Ar</div><div style="font-size:11px;color:#6C757D;">Revenu mensuel</div></div>
                <div><div style="font-size:24px;font-weight:800;color:#27AE60;" id="activeSubs">0</div><div style="font-size:11px;color:#6C757D;">Actifs</div></div>
                <div><div style="font-size:24px;font-weight:800;color:#E74C3C;" id="expiredSubs">0</div><div style="font-size:11px;color:#6C757D;">Expirés/Suspendus</div></div>
                <div><div style="font-size:24px;font-weight:800;color:#F39C12;" id="pendingSubs">0</div><div style="font-size:11px;color:#6C757D;">En attente</div></div>
            </div>
        </div>
        <div class="card" style="margin-bottom:12px;padding:12px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <select id="finFilter" onchange="loadFinances()" style="padding:8px;border-radius:6px;border:1px solid var(--border);">
                    <option value="all">📋 Tous</option>
                    <option value="active">🟢 Actifs</option>
                    <option value="expired">🔴 Expirés/Suspendus</option>
                    <option value="pending">🟡 En attente</option>
                    <option value="freemium">🆓 Freemium</option>
                    <option value="paying">💳 Payants</option>
                </select>
                <select id="finType" onchange="loadFinances()" style="padding:8px;border-radius:6px;border:1px solid var(--border);">
                    <option value="all">👥 Tous</option>
                    <option value="FLEET_MANAGER">🚛 Flottes</option>
                    <option value="COOPERATIVE">🏢 Coops</option>
                </select>
                <input type="text" id="finSearch" placeholder="🔍 Rechercher..." oninput="loadFinances()" style="padding:8px;border-radius:6px;border:1px solid var(--border);flex:1;min-width:150px;">
                <button class="btn btn-sm" onclick="exportFinances()">📥 Export CSV</button>
            </div>
        </div>
        <div class="card">
            <table><thead><tr>
                <th>Organisation</th><th>Type</th><th>Plan</th><th>Prix/mois</th>
                <th>Début</th><th>Échéance</th><th>Jours restants</th><th>Statut</th><th>Paiement</th><th>Actions</th>
            </tr></thead><tbody id="financesTable"></tbody></table>
        </div>`;
    loadFinances();
}

async function loadFinances() {
    var filter = document.getElementById('finFilter')?.value || 'all';
    var type = document.getElementById('finType')?.value || 'all';
    var search = (document.getElementById('finSearch')?.value || '').toLowerCase();
    
    try {
        var orgs = await apiGet('/organizations');
        var plans = await apiGet('/plans');
        if (!Array.isArray(orgs)) orgs = [];
        if (!Array.isArray(plans)) plans = [];
        
        var planMap = {};
        plans.forEach(p => { planMap[p.type+'_'+p.name] = p; });
        
        if (type !== 'all') orgs = orgs.filter(o => o.type === type);
        if (search) orgs = orgs.filter(o => (o.name||'').toLowerCase().includes(search) || (o.email||'').toLowerCase().includes(search));
        
        var totalRev = 0, activeCount = 0, expiredCount = 0, pendingCount = 0;
        
        document.getElementById('financesTable').innerHTML = orgs.length ? orgs.map(o => {
            var plan = planMap[o.type+'_'+(o.plan||'Freemium')] || {};
            var price = plan.price || 0;
            var isFreemium = (o.plan||'Freemium') === 'Freemium';
            
            // Statut automatique
            var autoStatus = o.status || 'pending';
            var echeance = o.subscriptionEnd;
            var echDate = echeance ? new Date(echeance) : new Date(Date.now() + 30*24*60*60*1000);
            var daysLeft = Math.ceil((echDate - new Date()) / (1000*60*60*24));
            var isExpired = daysLeft < 0;
            
            if (autoStatus === 'active') {
                if (!isFreemium && o.paymentStatus !== 'paid') autoStatus = 'suspended';
                if (isExpired) autoStatus = 'suspended';
            }
            
            // Compteurs
            if (autoStatus === 'active' && !isFreemium && price > 0) totalRev += price;
            if (autoStatus === 'active') activeCount++;
            if (autoStatus === 'pending') pendingCount++;
            if (autoStatus === 'suspended' || autoStatus === 'rejected') expiredCount++;
            
            // Filtres
            if (filter === 'active' && autoStatus !== 'active') return null;
            if (filter === 'expired' && autoStatus !== 'suspended' && autoStatus !== 'rejected') return null;
            if (filter === 'pending' && autoStatus !== 'pending') return null;
            if (filter === 'freemium' && !isFreemium) return null;
            if (filter === 'paying' && isFreemium) return null;
            
            var typeIcon = o.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop';
            var start = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : 'N/A';
            var echStr = echDate.toLocaleDateString('fr-FR');
            var daysStr = isExpired ? '<span style="color:#E74C3C;">Expiré</span>' : daysLeft + ' j';
            var statusIcon = autoStatus === 'active' ? '🟢' : autoStatus === 'pending' ? '🟡' : '🔴';
            var statusLabel = autoStatus === 'active' ? 'Actif' : autoStatus === 'pending' ? 'En attente' : autoStatus === 'suspended' ? 'Suspendu' : autoStatus;
            var paidIcon = o.paymentStatus === 'paid' ? '✅ Payé' : '❌ Impayé';
            
            var actions = '<button class="btn-sm btn-edit" onclick="changePlan(\''+o.id+'\',\''+(o.plan||'Freemium')+'\',\''+o.type+'\')">✏️</button>';
            if (autoStatus === 'active') {
                actions += '<button class="btn-sm" onclick="renewSub(\''+o.id+'\')" title="Renouveler">🔄</button>';
                actions += '<button class="btn-sm btn-view" onclick="markPaid(\''+o.id+'\')" title="Marquer payé">💵</button>';
            }
            if (autoStatus === 'pending') {
                actions += '<button class="btn-sm btn-view" onclick="activateOrg(\''+o.id+'\')" title="Activer">✅</button>';
            }
            actions += '<button class="btn-sm" onclick="suspendOrg(\''+o.id+'\')" title="Suspendre">⏸️</button>';
            
            return '<tr>' +
                '<td><strong>' + o.name + '</strong><br><small>' + (o.email || '') + '</small></td>' +
                '<td>' + typeIcon + '</td>' +
                '<td><span class="badge badge-info">' + (o.plan || 'Freemium') + '</span></td>' +
                '<td>' + (price === 0 ? 'Gratuit' : price.toLocaleString() + ' Ar') + '</td>' +
                '<td>' + start + '</td>' +
                '<td>' + echStr + '</td>' +
                '<td>' + daysStr + '</td>' +
                '<td>' + statusIcon + ' ' + statusLabel + '</td>' +
                '<td>' + paidIcon + '</td>' +
                '<td class="action-btns">' + actions + '</td>' +
            '</tr>';
        }).filter(Boolean).join('') : '<tr><td colspan="10">Aucune donnée</td></tr>';
        
        document.getElementById('totalRevenue').textContent = totalRev.toLocaleString() + ' Ar';
        document.getElementById('activeSubs').textContent = activeCount;
        document.getElementById('expiredSubs').textContent = expiredCount;
        document.getElementById('pendingSubs').textContent = pendingCount;
        
    } catch(e) { document.getElementById('financesTable').innerHTML = '<tr><td colspan="10">❌ Erreur</td></tr>'; }
}

function changePlan(orgId, currentPlan, type) {
    var plans = ['Freemium','Basic','Standard','Premium'];
    var h = '<h4>Changer le plan</h4><select id="newPlan" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:8px;">';
    plans.forEach(p => { h += '<option value="'+p+'" '+(p===currentPlan?'selected':'')+'>'+p+'</option>'; });
    h += '</select><button class="btn btn-primary" onclick="savePlan(\''+orgId+'\')">💾 Enregistrer</button>';
    showModal('Changer plan', h);
}
async function savePlan(orgId) {
    try { await apiPatch('/organizations/'+orgId, { plan: document.getElementById('newPlan').value }); closeModal(); loadFinances(); } catch(e) {}
}
async function renewSub(orgId) {
    if (!confirm('Renouveler 30 jours ?')) return;
    try { await apiPost('/organizations/'+orgId+'/renew', {}); loadFinances(); } catch(e) {}
}
async function markPaid(orgId) {
    if (!confirm('Marquer comme payé ?')) return;
    try { await apiPatch('/organizations/'+orgId, { paymentStatus: 'paid' }); loadFinances(); } catch(e) {}
}
async function activateOrg(orgId) {
    if (!confirm('Activer cette organisation ?')) return;
    try { await apiPatch('/organizations/'+orgId+'/status', { status: 'active' }); loadFinances(); } catch(e) {}
}
async function suspendOrg(orgId) {
    if (!confirm('Suspendre cette organisation ?')) return;
    try { await apiPatch('/organizations/'+orgId+'/status', { status: 'suspended' }); loadFinances(); } catch(e) {}
}
function exportFinances() {
    var rows = document.querySelectorAll('#financesTable tr');
    var csv = 'Organisation,Type,Plan,Prix,Début,Échéance,Jours,Statut,Paiement\n';
    rows.forEach(r => {
        var cells = r.querySelectorAll('td');
        if (cells.length >= 9) {
            csv += cells[0].innerText+','+cells[1].innerText+','+cells[2].innerText+','+cells[3].innerText+','+cells[4].innerText+','+cells[5].innerText+','+cells[6].innerText+','+cells[7].innerText+','+cells[8].innerText+'\n';
        }
    });
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'finances.csv'; a.click();
}
