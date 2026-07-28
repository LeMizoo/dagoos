function init_finances() {
    document.getElementById('mainInner').innerHTML = `
        <div class="topbar"><h1>💰 Finances</h1></div>
        <div class="card" style="margin-bottom:12px;padding:16px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;">
                <div><div style="font-size:24px;font-weight:800;color:#1A5276;" id="totalRevenue">0 Ar</div><div style="font-size:11px;color:#6C757D;">Revenu mensuel</div></div>
                <div><div style="font-size:24px;font-weight:800;color:#27AE60;" id="activeSubs">0</div><div style="font-size:11px;color:#6C757D;">Actifs</div></div>
                <div><div style="font-size:24px;font-weight:800;color:#E74C3C;" id="expiredSubs">0</div><div style="font-size:11px;color:#6C757D;">Suspendus</div></div>
                <div><div style="font-size:24px;font-weight:800;color:#F39C12;" id="pendingSubs">0</div><div style="font-size:11px;color:#6C757D;">En attente</div></div>
            </div>
        </div>
        <div class="card" style="margin-bottom:12px;padding:12px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <select id="finFilter" onchange="loadFinances()" style="padding:8px;border-radius:6px;border:1px solid var(--border);">
                    <option value="all">📋 Tous</option>
                    <option value="active">🟢 Actifs</option>
                    <option value="suspended">🔴 Suspendus</option>
                    <option value="pending">🟡 En attente</option>
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
                <th>Début</th><th>Échéance</th><th>Jours</th><th>Statut</th><th>Paiement</th><th>Actions</th>
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
        
        var totalRev = 0, activeCount = 0, suspendedCount = 0, pendingCount = 0;
        
        document.getElementById('financesTable').innerHTML = orgs.length ? orgs.map(o => {
            var plan = planMap[o.type+'_'+(o.plan||'Freemium')] || {};
            var price = plan.price || 0;
            var isFreemium = (o.plan||'Freemium') === 'Freemium';
            
            var autoStatus = o.status || 'pending';
            var echeance = o.subscriptionEnd;
            var echDate = echeance ? new Date(echeance) : new Date(Date.now() + 30*24*60*60*1000);
            var daysLeft = Math.ceil((echDate - new Date()) / (1000*60*60*24));
            var isExpired = daysLeft < 0;
            
            if (autoStatus === 'active' && !isFreemium && o.paymentStatus !== 'paid') autoStatus = 'suspended';
            if (autoStatus === 'active' && isExpired) autoStatus = 'suspended';
            
            if (autoStatus === 'active' && !isFreemium && price > 0 && o.paymentStatus === 'paid') totalRev += price;
            if (autoStatus === 'active') activeCount++;
            if (autoStatus === 'pending') pendingCount++;
            if (autoStatus === 'suspended' || autoStatus === 'rejected') suspendedCount++;
            
            if (filter === 'active' && autoStatus !== 'active') return null;
            if (filter === 'suspended' && autoStatus !== 'suspended' && autoStatus !== 'rejected') return null;
            if (filter === 'pending' && autoStatus !== 'pending') return null;
            
            var typeIcon = o.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop';
            var start = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : 'N/A';
            var echStr = echDate.toLocaleDateString('fr-FR');
            var daysStr = isExpired ? '<span style="color:#E74C3C;">Expiré</span>' : daysLeft + ' j';
            var statusIcon = autoStatus === 'active' ? '🟢' : autoStatus === 'pending' ? '🟡' : '🔴';
            var statusLabel = autoStatus === 'active' ? 'Actif' : autoStatus === 'pending' ? 'En attente' : autoStatus === 'suspended' ? 'Suspendu' : autoStatus;
            var paidIcon = o.paymentStatus === 'paid' ? '✅ Payé' : '❌ Impayé';
            var refTxt = o.paymentRef ? '<br><small style="color:#6C757D;">Réf: '+o.paymentRef+'</small>' : '';
            
            var actions = '';
            actions += '<button class="btn-sm btn-edit" onclick="changePlan(\''+o.id+'\',\''+(o.plan||'Freemium')+'\',\''+o.type+'\')" title="Plan">✏️</button>';
            if (autoStatus === 'active') {
                actions += '<button class="btn-sm" onclick="renewSub(\''+o.id+'\')" title="Renouveler">🔄</button>';
                actions += '<button class="btn-sm btn-view" onclick="validatePayment(\''+o.id+'\','+price+',\''+(o.plan||'Freemium')+'\',\''+o.name+'\')" title="Valider paiement">💵</button>';
                actions += '<button class="btn-sm" onclick="suspendOrg(\''+o.id+'\')" title="Suspendre">⏸️</button>';
            } else if (autoStatus === 'pending') {
                actions += '<button class="btn-sm btn-view" onclick="activateOrg(\''+o.id+'\')" title="Activer">✅</button>';
                actions += '<button class="btn-sm" onclick="suspendOrg(\''+o.id+'\')" title="Suspendre">⏸️</button>';
            } else if (autoStatus === 'suspended') {
                actions += '<button class="btn-sm btn-view" onclick="validatePayment(\''+o.id+'\','+price+',\''+(o.plan||'Freemium')+'\',\''+o.name+'\')" title="Payer pour réactiver">💵</button>';
                actions += '<button class="btn-sm btn-view" onclick="activateOrg(\''+o.id+'\')" title="Réactiver">✅</button>';
            }
            
            return '<tr>' +
                '<td><strong>' + o.name + '</strong><br><small>' + (o.email || '') + '</small></td>' +
                '<td>' + typeIcon + '</td>' +
                '<td><span class="badge badge-info">' + (o.plan || 'Freemium') + '</span></td>' +
                '<td>' + (price === 0 ? 'Gratuit' : price.toLocaleString() + ' Ar') + '</td>' +
                '<td>' + start + '</td>' +
                '<td>' + echStr + '</td>' +
                '<td>' + daysStr + '</td>' +
                '<td>' + statusIcon + ' ' + statusLabel + '</td>' +
                '<td>' + paidIcon + refTxt + '</td>' +
                '<td class="action-btns">' + actions + '</td>' +
            '</tr>';
        }).filter(Boolean).join('') : '<tr><td colspan="10">Aucune donnée</td></tr>';
        
        document.getElementById('totalRevenue').textContent = totalRev.toLocaleString() + ' Ar';
        document.getElementById('activeSubs').textContent = activeCount;
        document.getElementById('expiredSubs').textContent = suspendedCount;
        document.getElementById('pendingSubs').textContent = pendingCount;
        
    } catch(e) { document.getElementById('financesTable').innerHTML = '<tr><td colspan="10">❌ Erreur</td></tr>'; }
}

function validatePayment(orgId, amount, plan, name) {
    var h = '<h4>💵 Valider le paiement</h4>';
    h += '<p style="margin-bottom:8px;"><strong>'+name+'</strong> - Plan '+plan+'</p>';
    h += '<p style="font-size:18px;font-weight:700;color:#1A5276;margin-bottom:16px;">Montant dû : <span id="payAmount">'+amount.toLocaleString()+' Ar</span></p>';
    h += '<label style="font-size:13px;font-weight:500;display:block;margin-bottom:4px;">Montant reçu (Ar)</label>';
    h += '<input id="payReceived" type="number" value="'+amount+'" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:10px;" oninput="updatePayDiff('+amount+')">';
    h += '<div id="payDiff" style="margin-bottom:10px;font-size:13px;"></div>';
    h += '<label style="font-size:13px;font-weight:500;display:block;margin-bottom:4px;">Référence de paiement</label>';
    h += '<input id="payRef" placeholder="ex: MVola 034XXXXXXX, Orange Money, référence bancaire..." style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:12px;">';
    h += '<div style="display:flex;gap:8px;">';
    h += '<button class="btn" onclick="closeModal()" style="flex:1;background:var(--border);">Annuler</button>';
    h += '<button class="btn btn-primary" onclick="confirmPayment(\''+orgId+'\','+amount+')" style="flex:1;">✅ Valider le paiement</button>';
    h += '</div>';
    showModal('Valider paiement', h);
    setTimeout(function(){ updatePayDiff(amount); }, 100);
}

function updatePayDiff(amount) {
    var received = parseInt(document.getElementById('payReceived')?.value) || 0;
    var diff = received - amount;
    var el = document.getElementById('payDiff');
    if (el) {
        if (diff === 0) el.innerHTML = '<span style="color:#27AE60;">✅ Montant exact</span>';
        else if (diff > 0) el.innerHTML = '<span style="color:#F39C12;">⚠️ Trop perçu : +'+diff.toLocaleString()+' Ar</span>';
        else el.innerHTML = '<span style="color:#E74C3C;">❌ Manque : '+Math.abs(diff).toLocaleString()+' Ar</span>';
    }
}

async function confirmPayment(orgId, amount) {
    var received = document.getElementById('payReceived')?.value;
    var ref = document.getElementById('payRef')?.value.trim();
    if (!ref) return alert('La référence de paiement est obligatoire');
    if (!received || parseInt(received) < amount) return alert('Le montant reçu doit être au moins égal au montant dû');
    
    try {
        await apiPut('/organizations/'+orgId, { 
            paymentStatus: 'paid', 
            paymentRef: ref, 
            paymentAmount: parseInt(received),
            status: 'active'
        });
        closeModal();
        loadFinances();
    } catch(e) { alert('❌ Erreur'); }
}

function changePlan(orgId, currentPlan, type) {
    var plans = ['Freemium','Basic','Standard','Premium'];
    var h = '<h4>Changer le plan</h4><select id="newPlan" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:8px;">';
    plans.forEach(p => { h += '<option value="'+p+'" '+(p===currentPlan?'selected':'')+'>'+p+'</option>'; });
    h += '</select><button class="btn btn-primary" onclick="savePlan(\''+orgId+'\')">💾 Enregistrer</button>';
    showModal('Changer plan', h);
}
async function savePlan(orgId) { try { await apiPut('/organizations/'+orgId, { plan: document.getElementById('newPlan').value }); closeModal(); loadFinances(); } catch(e) {} }
async function renewSub(orgId) { if (!confirm('Renouveler 30 jours ?')) return; try { await apiPost('/organizations/'+orgId+'/renew', {}); loadFinances(); } catch(e) {} }
async function activateOrg(orgId) { if (!confirm('Activer cette organisation ?')) return; try { await apiPatch('/organizations/'+orgId+'/status', { status: 'active' }); loadFinances(); } catch(e) {} }
async function suspendOrg(orgId) { if (!confirm('Suspendre ?')) return; try { await apiPatch('/organizations/'+orgId+'/status', { status: 'suspended' }); loadFinances(); } catch(e) {} }
function exportFinances() {
    var rows = document.querySelectorAll('#financesTable tr');
    var csv = 'Organisation,Type,Plan,Prix,Début,Échéance,Jours,Statut,Paiement\n';
    rows.forEach(r => { var cells = r.querySelectorAll('td'); if (cells.length>=9) csv += cells[0].innerText+','+cells[1].innerText+','+cells[2].innerText+','+cells[3].innerText+','+cells[4].innerText+','+cells[5].innerText+','+cells[6].innerText+','+cells[7].innerText+','+cells[8].innerText+'\n'; });
    var blob = new Blob([csv], {type:'text/csv'}); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'finances.csv'; a.click();
}
