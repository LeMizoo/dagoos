// ========================================
// DAGOO'S - LANDING PAGE (Production)
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const DASHBOARD_URL = "https://dagoos.pages.dev/landing/admin";

console.log('%c🚀 Dagoo\'s', 'font-size: 32px; font-weight: bold; color: #1A5276;');
console.log('%cLa mobilité connectée... Chez les potes, ça roule.', 'font-size: 18px; color: #F39C12;');
console.log('%c🇲🇬 Salama Dago !', 'font-size: 16px; color: #27AE60;');

// ===== NETTOYAGE URL =====
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('token') || urlParams.has('user')) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
})();

// ===== API FUNCTIONS =====
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        return { success: response.ok, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

function logoutUser() {
    localStorage.removeItem('dagoos_token');
    localStorage.removeItem('dagoos_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function isAuthenticated() {
    const token = localStorage.getItem('dagoos_token');
    return !!token && token !== 'null' && token !== 'undefined';
}

// ===== UTILITAIRES =====
function showMessage(element, message, type) {
    element.innerHTML = `<div class="${type}-message">${message}</div>`;
}

// ===== HEADER SCROLL =====
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('header-scrolled', window.pageYOffset > 50);
});

// ===== MOBILE MENU =====
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav');
if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('open');
    });
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('open');
        });
    });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
});

// ===== STATS ANIMATION =====
const stats = document.querySelectorAll('.stat-number');
if (stats.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stat = entry.target;
                const target = parseInt(stat.dataset.target);
                let current = 0;
                const increment = Math.ceil(target / 60);
                const interval = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        stat.textContent = target;
                        clearInterval(interval);
                    } else {
                        stat.textContent = current;
                    }
                }, 30);
                observer.unobserve(stat);
            }
        });
    }, { threshold: 0.5 });
    stats.forEach(stat => observer.observe(stat));
}

// ===== INSCRIPTION =====
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const role = document.getElementById('registerRole').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (password !== confirmPassword) {
            showMessage(registerMessage, '❌ Les mots de passe ne correspondent pas', 'error');
            return;
        }
        if (password.length < 6) {
            showMessage(registerMessage, '❌ Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }
        
        const allowedRoles = ['COOPERATIVE', 'FLEET_MANAGER'];
        if (!allowedRoles.includes(role)) {
            showMessage(registerMessage, '❌ Ce type de compte n\'est pas autorisé', 'error');
            return;
        }
        
        showMessage(registerMessage, '⏳ Inscription en cours...', 'info');
        
        const result = await registerUser({ name, email, phone, role, password });
        
        if (result.success) {
            showMessage(registerMessage, '✅ Compte créé avec succès ! <a href="#login">Connectez-vous</a>', 'success');
            registerForm.reset();
        } else {
            showMessage(registerMessage, `❌ ${result.data?.error || 'Erreur lors de l\'inscription'}`, 'error');
        }
    });
}

// ===== CONNEXION =====
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        showMessage(loginMessage, '⏳ Connexion en cours...', 'info');
        
        const result = await loginUser(email, password);
        
        if (result.success) {
            const { token, user } = result.data;
            showMessage(loginMessage, '✅ Connexion réussie ! Redirection...', 'success');
            
            setTimeout(() => {
                window.location.href = `${DASHBOARD_URL}/?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
            }, 1000);
        } else {
            showMessage(loginMessage, `❌ ${result.data?.error || 'Email ou mot de passe incorrect'}`, 'error');
        }
    });
}

// ===== MISE À JOUR UI =====
function updateUIForAuth() {
    const navUl = document.querySelector('.nav ul');
    if (!navUl) return;
    
    const existingLogoutBtn = document.getElementById('landingLogoutBtn');
    
    if (isAuthenticated()) {
        if (!existingLogoutBtn) {
            const logoutLi = document.createElement('li');
            logoutLi.id = 'landingLogoutBtn';
            logoutLi.innerHTML = '<a href="#" class="btn-primary btn-small" style="background: #E74C3C;">🚪 Déconnexion</a>';
            logoutLi.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
                window.location.reload();
            });
            navUl.appendChild(logoutLi);
        }
    } else {
        if (existingLogoutBtn) existingLogoutBtn.remove();
    }
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Landing page chargée');
    updateUIForAuth();
});

// Ne pas rediriger automatiquement
// if (isAuthenticated()) {
//     window.location.href = DASHBOARD_URL;
// }
