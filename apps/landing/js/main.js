// ========================================
// DAGOO'S - LANDING PAGE
// ========================================

console.log('%c🚀 Dagoo\'s', 'font-size: 32px; font-weight: bold; color: #1A5276;');
console.log('%cLa mobilité connectée... Chez les potes, ça roule.', 'font-size: 18px; color: #F39C12;');
console.log('%c🇲🇬 Salama Dago !', 'font-size: 16px; color: #27AE60;');

// ===== HERO SLIDER =====
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slide');
const totalSlides = slides.length;

function nextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % totalSlides;
    slides[currentSlide].classList.add('active');
}

if (totalSlides > 1) {
    setInterval(nextSlide, 4000);
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Landing page chargée');
});
