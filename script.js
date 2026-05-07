/* ========================================
   CATACUMBAS DEL BEATERIO - JAVASCRIPT
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // Header Scroll Effect
    // ========================================
    const header = document.getElementById('header');
    
    function handleScroll() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    // ========================================
    // Mobile Menu Toggle
    // ========================================
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    
    menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking on a link
    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // ========================================
    // Smooth Scroll for Anchor Links
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========================================
    // Stats Counter Animation
    // ========================================
    const stats = document.querySelectorAll('.stat-number');
    let statsAnimated = false;

    function animateStats() {
        if (statsAnimated) return;
        
        const statsSection = document.querySelector('.stats');
        if (!statsSection) return;
        
        const sectionTop = statsSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.75) {
            statsAnimated = true;
            
            stats.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                const duration = 2000; // 2 seconds
                const start = 0;
                const startTime = performance.now();
                
                function updateCounter(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function for smooth animation
                    const easeOutQuad = 1 - (1 - progress) * (1 - progress);
                    const current = Math.floor(easeOutQuad * (target - start) + start);
                    
                    stat.textContent = current.toLocaleString('es-ES');
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    }
                }
                
                requestAnimationFrame(updateCounter);
            });
        }
    }

    window.addEventListener('scroll', animateStats);
    animateStats(); // Check initial state

    // ========================================
    // Scroll Animations
    // ========================================
    const animatedElements = document.querySelectorAll('.section-header, .history-content, .history-image, .visit-card, .schedule-item, .gallery-item, .sales-card, .contact-method');
    
    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
    });

    function checkScroll() {
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight * 0.85) {
                element.classList.add('visible');
            }
        });
    }

    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Check initial state

    // ========================================
    // Contact Form Handler
    // ========================================
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                message: formData.get('message')
            };
            
            // Here you would typically send the data to a server
            console.log('Form submitted:', data);
            
            // Show success message (you can customize this)
            alert('¡Gracias por tu mensaje! Te responderemos lo antes posible.');
            
            // Reset form
            contactForm.reset();
        });
    }

    // ========================================
    // Image Placeholder Click Handler
    // ========================================
    const imagePlaceholders = document.querySelectorAll('.image-placeholder, .hero-image-placeholder');
    
    imagePlaceholders.forEach(placeholder => {
        placeholder.style.cursor = 'pointer';
        placeholder.title = 'Haz clic aquí para añadir una imagen';
        
        placeholder.addEventListener('click', function() {
            console.log('Para añadir una imagen aquí, reemplaza este div con una etiqueta <img> o establece un background-image en CSS.');
        });
    });

    // ========================================
    // Parallax Effect on Hero (Optional)
    // ========================================
    const heroSection = document.querySelector('.hero');
    
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrolled = window.scrollY;
            const heroHeight = heroSection.offsetHeight;
            
            if (scrolled < heroHeight) {
                const heroBg = heroSection.querySelector('.hero-bg');
                if (heroBg) {
                    heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
                }
            }
        });
    }

    // ========================================
    // Gallery Lightbox (Basic Implementation)
    // ========================================
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            // For future implementation: Open lightbox with full-size image
            console.log('Galería: Implementar lightbox aquí cuando se añadan las imágenes');
        });
    });

    // ========================================
    // Preloader (Optional - for when images load)
    // ========================================
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });

});

// ========================================
// Helper Functions
// ========================================

/**
 * Debounce function to limit how often a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to ensure function fires at most once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum milliseconds between calls
 * @returns {Function}
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
