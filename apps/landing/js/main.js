// ========================================
// DAGO MOBILITY - LANDING PAGE
// ========================================

console.log('%c🚀 Dago Mobility', 'font-size: 32px; font-weight: bold; color: #1A5276;');
console.log('%cLa mobilité connectée... Chez les potes, ça roule.', 'font-size: 18px; color: #F39C12;');

// ===== PROVERBES MALGACHES =====
var proverbs = [
    '"Ny asa tsy mba vintana, fa fitsirihana" — Le succès dépend de votre persévérance.',
    '"Aleo very tsiky toy izay very hiky" — Protégez votre activité avec Dago Mobility.',
    '"Ny fianarana no lova tsara indrindra" — Le savoir est le meilleur héritage.',
    '"Mieux vaut être seul que mal accompagné" — Gérez votre flotte en toute confiance.',
];

// ===== HERO SLIDER =====
var currentSlide = 0;
var slides = document.querySelectorAll('.hero-slide');
var totalSlides = slides.length;

var dotsContainer = document.getElementById('heroDots');
if (dotsContainer && totalSlides > 1) {
    for (var i = 0; i < totalSlides; i++) {
        var dot = document.createElement('button');
        dot.onclick = (function(idx) { return function() { goToSlide(idx); }; })(i);
        if (i === 0) dot.classList.add('active');
        dotsContainer.appendChild(dot);
    }
}

var heroSection = document.querySelector('.hero');
if (heroSection && totalSlides > 1) {
    var prevBtn = document.createElement('button');
    prevBtn.className = 'hero-nav prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = prevSlide;
    var nextBtn = document.createElement('button');
    nextBtn.className = 'hero-nav next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = nextSlide;
    heroSection.appendChild(prevBtn);
    heroSection.appendChild(nextBtn);
}

function updateSlides() {
    slides.forEach(function(s, i) { s.classList.toggle('active', i === currentSlide); });
    var dots = document.querySelectorAll('#heroDots button');
    dots.forEach(function(d, i) { d.classList.toggle('active', i === currentSlide); });
    var proverbEl = document.getElementById('proverb');
    if (proverbEl) proverbEl.textContent = proverbs[currentSlide % proverbs.length];
}

function nextSlide() { currentSlide = (currentSlide + 1) % totalSlides; updateSlides(); }
function prevSlide() { currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; updateSlides(); }
function goToSlide(i) { currentSlide = i; updateSlides(); }

if (totalSlides > 1) setInterval(nextSlide, 5000);

// ===== HEADER SCROLL =====
var header = document.querySelector('.header');
window.addEventListener('scroll', function() {
    if (header) header.classList.toggle('header-scrolled', window.pageYOffset > 50);
});

// ===== MOBILE MENU =====
var hamburger = document.querySelector('.hamburger');
var navMenu = document.querySelector('.nav');
if (hamburger && navMenu) {
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('open');
    });
    navMenu.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('open');
        });
    });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#') return;
        var target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            var headerHeight = document.querySelector('.header') ? document.querySelector('.header').offsetHeight : 0;
            window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - headerHeight, behavior: 'smooth' });
        }
    });
});

// ===== CHARGER LES STATS =====
async function loadStats() {
    try {
        var res = await fetch('https://dagoos-api.onrender.com/api/stats');
        var data = res.ok ? await res.json() : { fleets: 0, coops: 0, drivers: 0 };
        var elF = document.getElementById('statFleets');
        var elD = document.getElementById('statDrivers');
        var elC = document.getElementById('statCoops');
        if (elF) elF.textContent = data.fleets;
        if (elD) elD.textContent = data.drivers;
        if (elC) elC.textContent = data.coops;
    } catch (e) {}
}

// ===== CHARGER LES PLANS =====
async function loadPlans() {
    try {
        var res = await fetch('https://dagoos-api.onrender.com/api/plans');
        if (!res.ok) return;
        var plans = await res.json();
        var fleetPlans = plans.filter(function(p) { return p.type === 'FLEET_MANAGER'; });
        var coopPlans = plans.filter(function(p) { return p.type === 'COOPERATIVE'; });
        var fleetEl = document.getElementById('fleetPlans');
        var coopEl = document.getElementById('coopPlans');
        if (fleetEl) fleetEl.innerHTML = fleetPlans.map(function(p) {
            return '<div style="display:flex;justify-content:space-between;font-size:12px;"><span>🔹 ' + p.name + '</span><span><strong>' + p.price.toLocaleString() + ' Ar</strong> · ' + p.vehiclesMax + ' véhicules · ' + p.driversMax + ' chauffeurs' + (p.name === 'Premium' ? ' <span style="background:#F1C40F;color:#1A1A2E;padding:2px 6px;border-radius:50px;font-size:10px;font-weight:600;">💡</span>' : '') + '</span></div>';
        }).join('');
        if (coopEl) coopEl.innerHTML = coopPlans.map(function(p) {
            return '<div style="display:flex;justify-content:space-between;font-size:12px;"><span>🔹 ' + p.name + '</span><span><strong>' + p.price.toLocaleString() + ' Ar</strong> · ' + p.vehiclesMax + ' véhicules · ' + p.driversMax + ' livreurs' + (p.name === 'Premium' ? ' <span style="background:#F1C40F;color:#1A1A2E;padding:2px 6px;border-radius:50px;font-size:10px;font-weight:600;">💡</span>' : '') + '</span></div>';
        }).join('');
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Landing page chargée');
    loadStats();
    loadPlans();
});
