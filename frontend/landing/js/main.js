// ========================================
// DAGOO'S - MAIN.JS
// La mobilité connectée... Chez les potes, ça roule.
// ========================================

(function() {
    'use strict';

    // ===== HEADER SCROLL =====
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
        lastScroll = currentScroll;
    });

    // ===== MOBILE MENU =====
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('open');
        });

        // Fermer le menu au clic sur un lien
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                nav.classList.remove('open');
            });
        });
    }

    // ===== ANIMATION DES STATS =====
    const stats = document.querySelectorAll('.stat-number');
    
    if (stats.length > 0) {
        const animateStats = () => {
            stats.forEach(stat => {
                const target = parseInt(stat.dataset.target);
                const current = parseInt(stat.textContent);
                const increment = Math.ceil(target / 60);
                
                if (current < target) {
                    const newValue = Math.min(current + increment, target);
                    stat.textContent = newValue;
                }
            });
        };

        // Observer les stats
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stat = entry.target;
                    const target = parseInt(stat.dataset.target);
                    stat.textContent = '0';
                    
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

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== ANIMATION AU SCROLL (Intersection Observer) =====
    const animateOnScroll = (elements, className = 'visible') => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(className);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => observer.observe(el));
    };

    // Appliquer l'animation aux cartes de services
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.5s ease ${index * 0.1}s`;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                    observer.unobserve(card);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(card);
    });

    // ===== CONSOLE MESSAGE =====
    console.log('%c🚀 Dagoo\'s', 'font-size: 32px; font-weight: bold; color: #1A5276;');
    console.log('%cLa mobilité connectée... Chez les potes, ça roule.', 'font-size: 18px; color: #F39C12;');
    console.log('%c🇲🇬 Salama Dago !', 'font-size: 16px; color: #27AE60;');

})();
