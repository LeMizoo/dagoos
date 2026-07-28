// DAGOO'S - Messages
async function init_messages() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>📧 Messages</h1>
      <button class="btn btn-primary btn-sm" onclick="newMessage()">➕ Nouveau</button>
    </div>
    <div class="card"><table><thead><tr>
      <th>Date</th><th>Sujet</th><th>Destinataire</th><th>Statut</th><th>Actions</th>
    </tr></thead><tbody id="messagesTable"></tbody></table></div>`;
  loadMessages();
}

async function loadMessages() {
  try {
    const msgs = await apiGet('/messages');
    document.getElementById('messagesTable').innerHTML = msgs.length ? msgs.map(m => `
      <tr>
        <td>${new Date(m.createdAt).toLocaleString('fr-FR')}</td>
        <td>${m.subject || 'Sans sujet'}</td>
        <td>${m.organization?.name || 'Tous'}</td>
        <td>${m.read ? '✅' : '🔵'}</td>
        <td class="action-btns">
          <button class="btn-sm btn-view" onclick="viewMsg('${m.id}')">👁</button>
        </td></tr>`).join('') : '<tr><td colspan="5">📭 Aucun message</td></tr>';
  } catch(e) {}
}

function newMessage() {
  const h = `
    <select id="newRecipient" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:10px;">
      <option value="all">📢 Tous</option><option value="FLEET_MANAGER">🚛 Flottes</option><option value="COOPERATIVE">🏢 Coops</option>
    </select>
    <input id="newSubject" placeholder="Sujet" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:10px;">
    <textarea id="newContent" rows="5" placeholder="Message..." style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:10px;"></textarea>
    <button class="btn btn-primary" onclick="sendMsg()" style="width:100%;">📤 Envoyer</button>`;
  showModal('Nouveau message', h);
}

async function sendMsg() {
  const s = document.getElementById('newSubject').value.trim();
  const c = document.getElementById('newContent').value.trim();
  if (!s || !c) return alert('Sujet et message requis');
  try { await apiPost('/messages', { subject: s, content: c, type: 'info' }); closeModal(); loadMessages(); } catch(e) {}
}
