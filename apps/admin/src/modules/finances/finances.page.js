// DAGOO'S - Abonnements
async function init_finances() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>💰 Abonnements</h1></div>
    <div class="card" style="margin-bottom:12px;padding:16px;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;">
        <div><div style="font-size:24px;font-weight:800;color:#1A5276;" id="totalRevenue">0 Ar</div><div style="font-size:11px;color:#6C757D;">Revenu mensuel</div></div>
        <div><div style="font-size:24px;font-weight:800;color:#27AE60;" id="activeSubs">0</div><div style="font-size:11px;color:#6C757D;">Actifs</div></div>
        <div><div style="font-size:24px;font-weight:800;color:#E74C3C;" id="suspendedSubs">0</div><div style="font-size:11px;color:#6C757D;">Suspendus</div></div>
        <div><div style="font-size:24px;font-weight:800;color:#F39C12;" id="pendingSubs">0</div><div style="font-size:11px;color:#6C757D;">En attente</div></div>
      </div>
    </div>
    <div class="card"><table><thead><tr>
      <th>Organisation</th><th>Type</th><th>Plan</th><th>Prix/mois</th><th>Statut</th><th>Paiement</th><th>Actions</th>
    </tr></thead><tbody id="financesTable"></tbody></table></div>`;
  
  loadFinances();
}

async function loadFinances() {
  try {
    const [orgs, plans] = await Promise.all([apiGet('/organizations'), apiGet('/plans')]);
    const planMap = {};
    plans.forEach(p => { planMap[p.type + '_' + p.name] = p; });
    
    let totalRev = 0, active = 0, suspended = 0, pending = 0;
    
    document.getElementById('financesTable').innerHTML = orgs.map(o => {
      const plan = planMap[o.type + '_' + (o.plan || 'Freemium')] || {};
      const price = plan.price || 0;
      const isFreemium = (o.plan || 'Freemium') === 'Freemium';
      
      let autoStatus = o.status || 'pending';
      if (autoStatus === 'active' && !isFreemium && o.paymentStatus !== 'paid') autoStatus = 'suspended';
      
      if (autoStatus === 'active' && !isFreemium && o.paymentStatus === 'paid') totalRev += price;
      if (autoStatus === 'active') active++; else if (autoStatus === 'pending') pending++; else suspended++;
      
      const icon = autoStatus === 'active' ? '🟢' : autoStatus === 'pending' ? '🟡' : '🔴';
      const label = autoStatus === 'active' ? 'Actif' : autoStatus === 'pending' ? 'En attente' : 'Suspendu';
      const paid = o.paymentStatus === 'paid' ? '✅ Payé' : '❌ Impayé';
      const typeIcon = o.type === 'FLEET_MANAGER' ? '🚛' : '🏢';
      
      return `<tr>
        <td><strong>${o.name}</strong><br><small>${o.email || ''}</small></td>
        <td>${typeIcon}</td>
        <td>${o.plan || 'Freemium'}</td>
        <td>${price === 0 ? 'Gratuit' : price.toLocaleString() + ' Ar'}</td>
        <td>${icon} ${label}</td>
        <td>${paid}</td>
        <td class="action-btns">
          <button class="btn-sm btn-view" onclick="validatePayment('${o.id}', ${price}, '${o.plan}', '${o.name}')">💵</button>
          <button class="btn-sm" onclick="changeStatus('${o.id}', '${autoStatus === 'active' ? 'suspended' : 'active'}')">${autoStatus === 'active' ? '⏸️' : '✅'}</button>
        </td></tr>`;
    }).join('');
    
    document.getElementById('totalRevenue').textContent = totalRev.toLocaleString() + ' Ar';
    document.getElementById('activeSubs').textContent = active;
    document.getElementById('suspendedSubs').textContent = suspended;
    document.getElementById('pendingSubs').textContent = pending;
  } catch(e) {}
}

function validatePayment(orgId, amount, plan, name) {
  const h = `<h4>Valider le paiement</h4>
    <p><strong>${name}</strong> - ${plan}</p>
    <p style="font-size:18px;">Montant : ${amount.toLocaleString()} Ar</p>
    <input id="payRef" placeholder="Référence (MVola, Orange Money...)" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:10px;">
    <button class="btn btn-primary" onclick="confirmPayment('${orgId}')">✅ Valider</button>`;
  showModal('Paiement', h);
}

async function confirmPayment(orgId) {
  const ref = document.getElementById('payRef').value.trim();
  if (!ref) return alert('Référence obligatoire');
  try { await apiPut('/organizations/' + orgId, { paymentStatus: 'paid', paymentRef: ref, status: 'active' }); closeModal(); loadFinances(); } catch(e) {}
}

async function changeStatus(id, status) {
  try { await apiPatch('/organizations/' + id + '/status', { status }); loadFinances(); } catch(e) {}
}
