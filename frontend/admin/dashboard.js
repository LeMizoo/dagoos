// ========================================
// DAGOO'S - ADMIN DASHBOARD
// ========================================

const API_URL = 'http://localhost:3000/api';

console.log('🚀 Dashboard Dagoo\'s chargé');

// ===== NETTOYAGE URL =====
// Nettoyer les paramètres de l'URL après récupération
const urlParams = new URLSearchParams(window.location.search);
let tokenFromUrl = urlParams.get('token');
const userFromUrl = urlParams.get('user');

// Nettoyer l'URL pour ne pas montrer le token
if (urlParams.has('token') || urlParams.has('user')) {
    window.history.replaceState({}, document.title, window.location.pathname);
}

if (tokenFromUrl === 'null' || tokenFromUrl === 'undefined' || !tokenFromUrl) {
    tokenFromUrl = null;
}

let token = localStorage.getItem('dagoos_token');
let user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');

// Si token dans l'URL, on le sauvegarde
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
        // Pas connecté : cacher le bouton, rediriger après 2 secondes
        if (logoutBtn) logoutBtn.style.display = 'none';
        document.getElementById('userInfo').textContent = '🔒 Non connecté';
        
        setTimeout(() => {
            window.location.href = 'http://localhost:5000/';
        }, 2000);
        return false;
    }
    
    // Connecté : afficher le bouton
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
        // Nettoyer TOUT le localStorage
        localStorage.removeItem('dagoos_token');
        localStorage.removeItem('dagoos_user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        console.log('👋 Déconnexion réussie - Redirection vers l\'accueil...');
        
        // Redirection vers la landing page SANS paramètres
        window.location.href = 'http://localhost:5000/';
    });
}

// ===== RÉCUPÉRER LES DONNÉES =====
async function loadDashboard() {
    if (!checkAuth()) {
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; color:#E74C3C;">
                    ⚠️ Redirection vers la page d'accueil...
                </td>
            </tr>
        `;
        return;
    }

    try {
        console.log('🔑 Token:', token.substring(0, 20) + '...');
        
        const response = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            console.log('⚠️ Token invalide ou expiré');
            localStorage.removeItem('dagoos_token');
            localStorage.removeItem('dagoos_user');
            document.getElementById('usersTableBody').innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; color:#E74C3C;">
                        ⚠️ Session expirée - <a href="http://localhost:5000/" style="color:#1A5276; font-weight:600;">Reconnectez-vous</a>
                    </td>
                </tr>
            `;
            document.getElementById('logoutBtn').style.display = 'none';
            return;
        }
        
        if (response.ok) {
            const users = await response.json();
            console.log('✅ Utilisateurs récupérés:', users.length);
            
            const tbody = document.getElementById('usersTableBody');
            if (users && users.length > 0) {
                tbody.innerHTML = users.map(u => `
                    <tr>
                        <td><strong>${u.name || 'N/A'}</strong></td>
                        <td>${u.email}</td>
                        <td>${u.phone || 'N/A'}</td>
                        <td><span class="badge badge-${(u.role || 'user').toLowerCase()}">${u.role || 'USER'}</span></td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center; color:#6C757D;">
                            📭 Aucun utilisateur pour le moment
                        </td>
                    </tr>
                `;
            }
            
            document.getElementById('totalUsers').textContent = users.length || 0;
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; color:#E74C3C;">
                    ❌ Erreur de connexion à l'API
                </td>
            </tr>
        `;
    }
}

// ===== CHARGER AU DÉMARRAGE =====
checkAuth();
loadDashboard();
