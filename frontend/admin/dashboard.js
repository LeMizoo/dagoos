// ========================================
// DAGOO'S - ADMIN DASHBOARD (v2)
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const LANDING_URL = "https://dagoos.pages.dev";

console.log('🚀 Dashboard Dagoos v2 chargé');

// ===== NETTOYAGE URL =====
const urlParams = new URLSearchParams(window.location.search);
let tokenFromUrl = urlParams.get('token');
const userFromUrl = urlParams.get('user');

if (urlParams.has('token') || urlParams.has('user')) {
    window.history.replaceState({}, document.title, window.location.pathname);
}

if (tokenFromUrl === 'null' || tokenFromUrl === 'undefined' || !tokenFromUrl) {
    tokenFromUrl = null;
}

let token = localStorage.getItem('dagoos_token');
let user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');

if (tokenFromUrl && tokenFromUrl !== 'null') {
    token = tokenFromUrl;
    localStorage.setItem('dagoos_token', token);
    if (userFromUrl && userFromUrl !== 'null') {
        try {
            user = JSON.parse(decodeURIComponent(userFromUrl));
            localStorage.setItem('dagoos_user', JSON.stringify(user));
        } catch (e) {
            console.log('Erreur parsing user:', e);
        }
    }
}

// ===== VÉRIFIER AUTHENTIFICATION =====
function checkAuth() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!token || token === 'null' || token === 'undefined') {
        if (logoutBtn) logoutBtn.style.display = 'none';
        document.getElementById('userInfo').textContent = '🔒 Non connecté';
        setTimeout(() => { window.location.href = LANDING_URL; }, 2000);
        return false;
    }
    
    if (logoutBtn) logoutBtn.style.display = 'flex';
    return true;
}

// ===== AFFICHER L'UTILISATEUR =====
if (user && user.name) {
    document.getElementById('userInfo').textContent = `👋 ${user.name} (${user.role || 'Utilisateur'})`;
} else if (user && user.email) {
    document.getElementById('userInfo').textContent = `👋 ${user.email} (${user.role || 'Utilisateur'})`;
} else {
    document.getElementById('userInfo').textContent = '👋 Utilisateur';
}

// ===== BOUTON DÉCONNEXION =====
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('dagoos_token');
        localStorage.removeItem('dagoos_user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('👋 Déconnexion réussie');
        window.location.href = LANDING_URL;
    });
}

// ===== NAVIGATION ENTRE SECTIONS =====
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
    const navLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (navLink) navLink.classList.add('active');
}

// Attacher les événements aux liens de navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = item.getAttribute('data-section');
        if (sectionId) showSection(sectionId);
    });
});

// ===== FONCTIONS API GÉNÉRIQUES =====
async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    return fetch(`${API_URL}${endpoint}`, { ...options, headers });
}

// ===== CHARGER LES UTILISATEURS =====
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    try {
        const response = await apiFetch('/users');
        if (response.status === 401) throw new Error('SESSION_EXPIRED');
        if (response.ok) {
            const users = await response.json();
            if (users.length > 0) {
                tbody.innerHTML = users.map(u => `
                    <tr>
                        <td><strong>${u.name || 'N/A'}</strong></td>
                        <td>${u.email}</td>
                        <td>${u.phone || 'N/A'}</td>
                        <td><span class="badge badge-${(u.role || 'user').toLowerCase()}">${u.role || 'USER'}</span></td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#6C757D;">📭 Aucun utilisateur</td></tr>';
            }
            document.getElementById('totalUsers').textContent = users.length || 0;
        }
    } catch (error) {
        if (error.message === 'SESSION_EXPIRED') {
            localStorage.clear();
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#E74C3C;">⚠️ Session expirée - <a href="' + LANDING_URL + '">Reconnectez-vous</a></td></tr>';
            document.getElementById('logoutBtn').style.display = 'none';
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#E74C3C;">❌ Erreur de connexion</td></tr>';
        }
    }
}

// ===== CHARGER LES CHAUFFEURS =====
async function loadDrivers() {
    const tbody = document.getElementById('driversTableBody');
    try {
        const response = await apiFetch('/fleet/drivers');
        if (response.status === 401) throw new Error('SESSION_EXPIRED');
        if (response.ok) {
            const drivers = await response.json();
            if (drivers.length > 0) {
                tbody.innerHTML = drivers.map(d => `
                    <tr>
                        <td><strong>${d.user?.name || 'N/A'}</strong></td>
                        <td>${d.user?.email || 'N/A'}</td>
                        <td>${d.phone || 'N/A'}</td>
                        <td>${d.licenseNumber || 'N/A'}</td>
                        <td>${d.vehicle?.plateNumber || 'Non assigné'}</td>
                        <td><span class="badge ${d.isAvailable ? 'badge-cooperative' : 'badge-super_admin'}">${d.isAvailable ? 'Disponible' : 'Indisponible'}</span></td>
                        <td>
                            <button onclick="editDriver('${d.id}')" style="background:#1A5276; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; margin-right:4px;">✏️</button>
                            <button onclick="deleteDriver('${d.id}')" style="background:#E74C3C; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">🗑️</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#6C757D;">📭 Aucun chauffeur</td></tr>';
            }
            document.getElementById('totalDrivers').textContent = drivers.length || 0;
        }
    } catch (error) {
        if (error.message === 'SESSION_EXPIRED') {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#E74C3C;">⚠️ Session expirée</td></tr>';
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#E74C3C;">❌ Erreur de connexion</td></tr>';
        }
    }
}

// ===== AJOUTER UN CHAUFFEUR =====
async function addDriver(e) {
    e.preventDefault();
    const form = document.getElementById('addDriverForm');
    const msg = document.getElementById('addDriverMessage');
    
    const data = {
        name: document.getElementById('driverName').value.trim(),
        email: document.getElementById('driverEmail').value.trim(),
        phone: document.getElementById('driverPhone').value.trim(),
        password: document.getElementById('driverPassword').value,
        licenseNumber: document.getElementById('driverLicense').value.trim()
    };
    
    if (data.password.length < 6) {
        msg.innerHTML = '<div class="error-message">❌ Le mot de passe doit contenir au moins 6 caractères</div>';
        return;
    }
    
    msg.innerHTML = '<div class="info-message">⏳ Ajout en cours...</div>';
    
    try {
        const response = await apiFetch('/fleet/drivers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (response.ok) {
            msg.innerHTML = '<div class="success-message">✅ Chauffeur ajouté avec succès !</div>';
            form.reset();
            loadDrivers();
            loadUsers();
        } else {
            msg.innerHTML = `<div class="error-message">❌ ${result.error || 'Erreur lors de l\'ajout'}</div>`;
        }
    } catch (error) {
        msg.innerHTML = '<div class="error-message">❌ Erreur de connexion</div>';
    }
}

// ===== SUPPRIMER UN CHAUFFEUR =====
async function deleteDriver(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce chauffeur ?')) return;
    
    try {
        const response = await apiFetch(`/fleet/drivers/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadDrivers();
            loadUsers();
        } else {
            const result = await response.json();
            alert('❌ ' + (result.error || 'Erreur lors de la suppression'));
        }
    } catch (error) {
        alert('❌ Erreur de connexion');
    }
}

// ===== MODIFIER UN CHAUFFEUR (basculer disponibilité) =====
async function editDriver(id) {
    const newStatus = confirm('Rendre ce chauffeur disponible ? (OK = Disponible, Annuler = Indisponible)');
    
    try {
        const response = await apiFetch(`/fleet/drivers/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ isAvailable: newStatus })
        });
        if (response.ok) {
            loadDrivers();
        } else {
            const result = await response.json();
            alert('❌ ' + (result.error || 'Erreur lors de la modification'));
        }
    } catch (error) {
        alert('❌ Erreur de connexion');
    }
}

// Rendre les fonctions accessibles globalement
window.editDriver = editDriver;
window.deleteDriver = deleteDriver;

// ===== CHARGEMENT GLOBAL =====
async function loadDashboard() {
    if (!checkAuth()) return;
    
    // Adapter la visibilité selon le rôle
    const role = user.role;
    const canManageDrivers = ['SUPER_ADMIN', 'ADMIN', 'FLEET_MANAGER'].includes(role);
    
    // Afficher/masquer la section chauffeurs dans la sidebar
    const driversNavItem = document.querySelector('[data-section="section-drivers"]');
    if (driversNavItem) {
        driversNavItem.style.display = canManageDrivers ? 'flex' : 'none';
    }
    
    // Charger les données
    await Promise.all([
        loadUsers(),
        loadDrivers()
    ]);
    
    // Afficher la section utilisateurs par défaut
    showSection('section-users');
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Dashboard v2 initialisé');
    loadDashboard();
});
