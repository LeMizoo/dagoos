// ========================================
// DAGOO'S - ADMIN DASHBOARD
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const LOGIN_URL = 'index.html';
const LANDING_URL = 'https://dago-mobility.pages.dev';

console.log('🚀 Dashboard Admin Dagoo\'s chargé');

// ===== VÉRIFIER AUTH =====
const token = localStorage.getItem('dagoos_token');
const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');

function checkAuth() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        if (logoutBtn) logoutBtn.style.display = 'none';
        document.getElementById('userInfo').textContent = '🔒 Accès non autorisé';
        setTimeout(() => { window.location.href = LOGIN_URL; }, 2000);
        return false;
    }
    
    if (logoutBtn) logoutBtn.style.display = 'flex';
    return true;
}

// ===== AFFICHER UTILISATEUR =====
if (user.name) {
    document.getElementById('userInfo').textContent = `👋 ${user.name} (${user.role})`;
} else if (user.email) {
    document.getElementById('userInfo').textContent = `👋 ${user.email}`;
}

// ===== DÉCONNEXION =====
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('dagoos_token');
    localStorage.removeItem('dagoos_user');
    window.location.href = LANDING_URL;
});

// ===== CHARGER UTILISATEURS =====
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = LOGIN_URL;
            return;
        }
        
        const users = await response.json();
        const tbody = document.getElementById('usersTableBody');
        
        if (users.length > 0) {
            tbody.innerHTML = users.map(u => `
                <tr>
                    <td><strong>${u.name || 'N/A'}</strong></td>
                    <td>${u.email}</td>
                    <td>${u.phone || 'N/A'}</td>
                    <td><span class="badge badge-${(u.role || 'user').toLowerCase()}">${u.role || 'USER'}</span></td>
                    <td>${new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#6C757D;">📭 Aucun utilisateur</td></tr>';
        }
        
        document.getElementById('totalUsers').textContent = users.length;
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

// ===== INIT =====
if (checkAuth()) {
    loadUsers();
}
