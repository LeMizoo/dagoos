// ========================================
// DAGOO'S - LANDING PAGE
// ========================================

import { registerUser, loginUser, logoutUser, isAuthenticated, getProfile } from './api.js';

console.log('%c🚀 Dagoo\'s', 'font-size: 32px; font-weight: bold; color: #1A5276;');
console.log('%cLa mobilité connectée... Chez les potes, ça roule.', 'font-size: 18px; color: #F39C12;');
console.log('%c🇲🇬 Salama Dago !', 'font-size: 16px; color: #27AE60;');

// ===== NETTOYAGE DES TOKENS AU CHARGEMENT =====
// Ne pas rediriger automatiquement, mais nettoyer si token expiré
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('token')) {
    // Si quelqu'un arrive avec un token dans l'URL, on le nettoie
    console.log('🧹 Nettoyage des paramètres URL...');
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ===== GESTION DES FORMULAIRES =====

// Formulaire d'inscription
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
        
        // Validation
        if (password !== confirmPassword) {
            messageDiv.innerHTML = '<div class="error-message">❌ Les mots de passe ne correspondent pas</div>';
            return;
        }
        
        if (password.length < 6) {
            messageDiv.innerHTML = '<div class="error-message">❌ Le mot de passe doit contenir au moins 6 caractères</div>';
            return;
        }
        
        // Bloquer SUPER_ADMIN
        if (role === 'SUPER_ADMIN') {
            messageDiv.innerHTML = '<div class="error-message">❌ Ce rôle n\'est pas autorisé</div>';
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

// Formulaire de connexion
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
            
            // Redirection vers le dashboard avec token
            setTimeout(() => {
                window.location.href = `http://localhost:5001/?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
            }, 1000);
        } else {
            messageDiv.innerHTML = `<div class="error-message">❌ ${result.data?.error || 'Email ou mot de passe incorrect'}</div>`;
        }
    });
}

// ===== BOUTON DÉCONNEXION SUR LA LANDING (si connecté) =====
function updateUIForAuth() {
    const navUl = document.querySelector('.nav ul');
    if (!navUl) return;
    
    // Vérifier si déjà un bouton déconnexion existe
    const existingLogoutBtn = document.getElementById('landingLogoutBtn');
    
    if (isAuthenticated()) {
        // Ajouter bouton déconnexion s'il n'existe pas déjà
        if (!existingLogoutBtn) {
            const logoutLi = document.createElement('li');
            logoutLi.id = 'landingLogoutBtn';
            logoutLi.innerHTML = '<a href="#" class="btn-primary btn-small" style="background: #E74C3C;">🚪 Déconnexion</a>';
            logoutLi.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
                // Recharger la page proprement
                window.location.href = 'http://localhost:5000/';
            });
            navUl.appendChild(logoutLi);
        }
        
        // Cacher le bouton "Salama Dago!"
        const registerLink = navUl.querySelector('a[href="#register"]');
        if (registerLink) {
            registerLink.textContent = '👤 Mon compte';
            registerLink.href = 'http://localhost:5001/';
        }
    } else {
        // Supprimer le bouton déconnexion s'il existe
        if (existingLogoutBtn) {
            existingLogoutBtn.remove();
        }
        
        // Remettre le bouton "Salama Dago!"
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

// ===== ANIMATION DES STATISTIQUES =====
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
    
    // Animer les stats quand elles deviennent visibles
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

// Mettre à jour l'UI quand l'auth change
window.addEventListener('storage', updateUIForAuth);
