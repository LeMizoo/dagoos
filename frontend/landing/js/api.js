// ========================================
// DAGOO'S - API CONNECTION
// ========================================

// Utiliser l'API en ligne ou en local selon l'environnement
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://dagoos-api.onrender.com/api';

console.log(`🔗 API URL: ${API_URL}`);

// ===== INSCRIPTION =====
export async function registerUser(userData) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        
        const data = await response.json();
        return { success: response.ok, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===== CONNEXION =====
export async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('dagoos_token', data.token);
            localStorage.setItem('dagoos_user', JSON.stringify(data.user));
        }
        return { success: response.ok, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===== PROFIL =====
export async function getProfile() {
    const token = localStorage.getItem('dagoos_token');
    if (!token) return { success: false, error: 'Non authentifié' };
    
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        const data = await response.json();
        return { success: response.ok, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===== DÉCONNEXION =====
export function logoutUser() {
    localStorage.removeItem('dagoos_token');
    localStorage.removeItem('dagoos_user');
    window.location.href = '/';
}

// ===== VÉRIFIER SI CONNECTÉ =====
export function isAuthenticated() {
    return !!localStorage.getItem('dagoos_token');
}
