// DAGOO'S - Modal
function showModal(title, content) {
  let modal = document.getElementById('dagModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'dagModal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal()"></div>
    <div class="modal-content">
      <div class="modal-header"><h3>${title}</h3><button onclick="closeModal()">✕</button></div>
      <div class="modal-body">${content}</div>
    </div>`;
  modal.style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('dagModal');
  if (modal) modal.style.display = 'none';
}
