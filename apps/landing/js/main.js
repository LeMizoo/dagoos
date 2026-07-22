// ========================================
// DAGO MOBILITY - LANDING PAGE
// ========================================

console.log('%c🚀 Dago Mobility', 'font-size: 32px; font-weight: bold; color: #1A5276;');
console.log('%cLa mobilité connectée... Chez les potes, ça roule.', 'font-size: 18px; color: #F39C12;');

// ===== PROVERBES MALGACHES =====
const proverbs = [
    '"Ny asa tsy mba vintana, fa fitsirihana" — Le succès dépend de votre persévérance.',
    '"Aleo very tsiky toy izay very hiky" — Protégez votre activité avec Dago Mobility.',
    '"Ny fianarana no lova tsara indrindra" — Le savoir est le meilleur héritage.',
    '"Mieux vaut être seul que mal accompagné" — Gérez votre flotte en toute confiance.',
];

// ===== HERO SLIDER =====
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slide');
const totalSlides = slides.length;

// Créer les dots
const dotsContainer = document.getElementById('heroDots');
for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.onclick = () => goToSlide(i);
    if (i === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);
}

function updateSlides() {
    slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
    document.querySelectorAll('#heroDots button').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    document.getElementById('proverb').textContent = proverbs[currentSlide % proverbs.length];
}

function nextSlide() { currentSlide = (currentSlide + 1) % totalSlides; updateSlides(); }
function prevSlide() { currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; updateSlides(); }
function goToSlide(i) { currentSlide = i; updateSlides(); }

if (totalSlides > 1) {
    setInterval(nextSlide, 5000);
}

// ===== CLOSE DROPDOWN ON CLICK OUTSIDE =====
document.addEventListener('click', (e) => {
    if (!e.target.closest('.login-dropdown')) {
        document.getElementById('loginDropdown')?.classList.remove('show');
    }
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Landing page chargée');
});

// ===== CHARGER LES PLANS DYNAMIQUEMENT =====
async function loadPlans() {
    try {
        const response = await fetch('https://dagoos-api.onrender.com/api/plans');
        if (!response.ok) return;
        const plans = await response.json();
        
        const fleetPlans = plans.filter(p => p.type === 'FLEET_MANAGER');
        const coopPlans = plans.filter(p => p.type === 'COOPERATIVE');
        
        const fleetEl = document.getElementById('fleetPlans');
        const coopEl = document.getElementById('coopPlans');
        
        if (fleetEl) {
            fleetEl.innerHTML = fleetPlans.map(p => `
                <div style="display:flex;justify-content:space-between;font-size:12px;">
                    <span>🔹 ${p.name}</span>
                    <span><strong>${p.price.toLocaleString()} Ar</strong> · ${p.vehiclesMax} véhicules · ${p.driversMax} chauffeurs</span>
                </div>`).join('');
        }
        
        if (coopEl) {
            coopEl.innerHTML = coopPlans.map(p => `
                <div style="display:flex;justify-content:space-between;font-size:12px;">
                    <span>🔹 ${p.name}</span>
                    <span><strong>${p.price.toLocaleString()} Ar</strong> · ${p.vehiclesMax} véhicules · ${p.driversMax} livreurs</span>
                </div>`).join('');
        }
    } catch (e) {
        console.log('Plans non disponibles, affichage par défaut');
    }
}

document.addEventListener('DOMContentLoaded', loadPlans);
