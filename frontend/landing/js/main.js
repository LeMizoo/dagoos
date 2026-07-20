// ========================================
// DAGOO'S - LANDING PAGE
// ========================================

import { registerUser, loginUser, logoutUser, isAuthenticated } from './api.js';

const DASHBOARD_URL = 'https://dagoos.pages.dev';
const LANDING_URL = 'https://dagoos.pages.dev';

console.log('%c🚀 Dagoo\'s', 'font-size: 32px; font-weight: bold; color: #1A5276;');
console.log('%cLa mobilité connectée... Chez les potes, ça roule.', 'font-size: 18px; color: #F39C12;');
console.log('%c🇲🇬 Salama Dago !', 'font-size: 16px; color: #27AE60;');

// ===== NETTOYAGE URL =====
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('token')) {
    console.log('🧹 Nettoyage des paramètres URL...');
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ===== FORMULAIRE INSCRIPTION =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const role = document.getElementById('registerRole').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        const messageDiv = document.getElementById('registerMessage');
        
        if (password !== confirmPassword) {
            messageDiv.innerHTML = '<div class="error-message">❌ Les mots de passe ne correspondent pas</div>';
            return;
        }
        
        if (password.length < 6) {
            messageDiv.innerHTML = '<div class="error-message">❌ Le mot de passe doit contenir au moins 6 caractères</div>';
            return;
        }
        
        const allowedRoles = ['COOPERATIVE', 'FLEET_MANAGER'];
        if (!allowedRoles.includes(role)) {
            messageDiv.innerHTML = '<div class="error-message">❌ Ce type de compte n\'est pas autorisé</div>';
            return;
        }
        
        messageDiv.innerHTML = '<div class="info-message">⏳ Inscription en cours...</div>';
        
        const result = await registerUser({ name, email, phone, role, password });
        
        if (result.success) {
            messageDiv.innerHTML = `
                <div class="success-message">
                    ✅ Compte créé avec succès ! 
                    <a href="#login" style="color: #1A5276; font-weight: 600;">Connectez-vous</a>
                </div>
            `;
            registerForm.reset();
        } else {
            messageDiv.innerHTML = `<div class="error-message">❌ ${result.data?.error || 'Erreur lors de l\'inscription'}</div>`;
        }
    });
}

// ===== FORMULAIRE CONNEXION =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        const messageDiv = document.getElementById('loginMessage');
        messageDiv.innerHTML = '<div class="info-message">⏳ Connexion en cours...</div>';
        
        const result = await loginUser(email, password);
        
        if (result.success) {
            const { token, user } = result.data;
            
            messageDiv.innerHTML = '<div class="success-message">✅ Connexion réussie ! Redirection...</div>';
            
            setTimeout(() => {
                window.location.href = `${DASHBOARD_URL}/?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
            }, 1000);
        } else {
            messageDiv.innerHTML = `<div class="error-message">❌ ${result.data?.error || 'Email ou mot de passe incorrect'}</div>`;
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
                window.location.href = LANDING_URL;
            });
            navUl.appendChild(logoutLi);
        }
        
        const registerLink = navUl.querySelector('a[href="#register"]');
        if (registerLink) {
            registerLink.textContent = '👤 Dashboard';
            registerLink.href = DASHBOARD_URL;
        }
    } else {
        if (existingLogoutBtn) {
            existingLogoutBtn.remove();
        }
        
        const registerLink = navUl.querySelector('a[href="#register"]');
        if (registerLink) {
            registerLink.textContent = 'Salama Dago !';
            registerLink.href = '#register';
        }
    }
}

// ===== HAMBURGER MENU =====
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('.nav ul');
if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
        nav.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
}

// ===== ANIMATION STATS =====
function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateStat = () => {
            current += step;
            if (current < target) {
                stat.textContent = Math.floor(current);
                requestAnimationFrame(updateStat);
            } else {
                stat.textContent = target;
            }
        };
        
        updateStat();
    });
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Landing page chargée');
    updateUIForAuth();
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                observer.unobserve(entry.target);
            }
        });
    });
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }
});

window.addEventListener('storage', updateUIForAuth);
