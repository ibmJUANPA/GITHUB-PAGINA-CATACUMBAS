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
    const formSuccess = document.getElementById('formSuccess');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = {
                nombre: formData.get('nombre'),
                apellidos: formData.get('apellidos'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                asunto: formData.get('asunto'),
                mensaje: formData.get('mensaje')
            };
            
            // Here you would typically send the data to a server
            console.log('Form submitted:', data);
            
            // Hide form and show success message
            contactForm.style.display = 'none';
            if (formSuccess) {
                formSuccess.classList.add('active');
            }
            
            // Reset form after a delay
            setTimeout(() => {
                contactForm.reset();
            }, 1000);
        });
    }

    // ========================================
    // Image Placeholder Click Handler
    // ========================================
    const imagePlaceholders = document.querySelectorAll('.image-placeholder:not(.image-placeholder-photo), .hero-image-placeholder:not(.hero-image-real)');
    
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
    // Gallery Filter (for Gallery Page)
    // ========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryMasonryItems = document.querySelectorAll('.gallery-masonry-item');
    
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                const filter = this.getAttribute('data-filter');
                
                galleryMasonryItems.forEach(item => {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    // ========================================
    // Gallery Lightbox
    // ========================================
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const galleryWrappers = document.querySelectorAll('.gallery-image-wrapper');
    
    let currentImageIndex = 0;
    const galleryImages = [];

    function updateLightboxImage(index) {
        const imageData = galleryImages[index];
        if (!imageData || !lightboxImage) return;

        lightboxImage.src = imageData.src || '';
        lightboxImage.alt = imageData.alt || imageData.caption || '';

        if (lightboxCaption) {
            lightboxCaption.textContent = imageData.caption;
        }
    }
    
    // Collect all gallery images
    galleryWrappers.forEach((wrapper, index) => {
        const caption = wrapper.querySelector('.gallery-caption');
        const image = wrapper.querySelector('img');
        galleryImages.push({
            index: index,
            caption: caption ? caption.textContent : '',
            src: image ? image.src : '',
            alt: image ? image.alt : ''
        });
        
        wrapper.addEventListener('click', function() {
            if (lightbox) {
                currentImageIndex = index;
                updateLightboxImage(currentImageIndex);
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Close lightbox
    if (lightboxClose) {
        lightboxClose.addEventListener('click', function() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close on background click
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Navigation
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', function() {
            currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
            updateLightboxImage(currentImageIndex);
        });
    }
    
    if (lightboxNext) {
        lightboxNext.addEventListener('click', function() {
            currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
            updateLightboxImage(currentImageIndex);
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (lightbox && lightbox.classList.contains('active')) {
            if (e.key === 'Escape') {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            } else if (e.key === 'ArrowLeft' && lightboxPrev) {
                lightboxPrev.click();
            } else if (e.key === 'ArrowRight' && lightboxNext) {
                lightboxNext.click();
            }
        }
    });

    // ========================================
    // Preloader (Optional - for when images load)
    // ========================================
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });

    // ========================================
    // Events Carousel
    // ========================================
    const eventsApp = document.getElementById('eventsCarouselApp');

    if (eventsApp) {
        const endpoint = eventsApp.getAttribute('data-events-endpoint') || './data/events.json';
        const localEventFallbackImage = 'img/1624829075563-1536x1149.jpg';
        const stage = document.getElementById('eventsCarouselStage');
        const state = document.getElementById('eventsCarouselState');
        const track = document.getElementById('eventsCarouselTrack');
        const controls = document.getElementById('eventsCarouselControls');
        const dots = document.getElementById('eventsCarouselDots');
        const status = document.getElementById('eventsCarouselStatus');
        const prevButton = document.getElementById('eventsPrev');
        const nextButton = document.getElementById('eventsNext');

        let currentIndex = 0;
        let events = [];
        let autoplayId = null;

        const formatDate = (value) => {
            if (!value) {
                return 'Fecha pendiente de confirmar';
            }

            try {
                return new Intl.DateTimeFormat('es-ES', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                }).format(new Date(value));
            } catch (error) {
                return value;
            }
        };

        const formatUpdatedAt = (value) => {
            if (!value) {
                return 'Sin sincronizacion previa';
            }

            try {
                return new Intl.DateTimeFormat('es-ES', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }).format(new Date(value));
            } catch (error) {
                return value;
            }
        };

        const formatPrice = (value) => {
            if (!value) {
                return '';
            }

            const amount = value.replace(/[^\d.,]/g, '');
            return amount ? `${amount}€` : value;
        };

        const fallbackImage = (title) => `
            <div class="events-carousel-placeholder">
                <span>${title}</span>
            </div>
        `;

        const buildSlide = (event) => {
            const visual = event.image
                ? `<img src="${event.image}" alt="${event.title}" loading="lazy" onerror="this.onerror=null;this.src='${localEventFallbackImage}'">`
                : fallbackImage(event.title);

            const price = event.price
                ? `<span class="events-carousel-price">${formatPrice(event.price)}</span>`
                : '';

            return `
                <article class="events-carousel-slide">
                    <div class="events-carousel-card">
                        <div class="events-carousel-visual">
                            ${visual}
                        </div>
                        <div class="events-carousel-content">
                            <div class="events-carousel-meta">
                                <span class="events-carousel-pill">${formatDate(event.startsAt)}</span>
                                <span class="events-carousel-pill">${event.location || 'Cadiz'}</span>
                            </div>
                            <h3>${event.title}</h3>
                            <p>Reserva este evento en Triocio. La informacion de esta tarjeta se sincroniza periodicamente para reflejar cambios recientes.</p>
                            ${price}
                            <div class="events-carousel-actions">
                                <a href="${event.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Reservar en Triocio</a>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        };

        const updateControls = () => {
            if (!dots) {
                return;
            }

            Array.from(dots.children).forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });

            if (prevButton) {
                prevButton.disabled = events.length <= 1;
            }

            if (nextButton) {
                nextButton.disabled = events.length <= 1;
            }
        };

        const goToSlide = (index) => {
            if (!track || events.length === 0) {
                return;
            }

            currentIndex = (index + events.length) % events.length;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            updateControls();
        };

        const startAutoplay = () => {
            if (events.length <= 1) {
                return;
            }

            clearInterval(autoplayId);
            autoplayId = window.setInterval(() => {
                goToSlide(currentIndex + 1);
            }, 6000);
        };

        const stopAutoplay = () => {
            clearInterval(autoplayId);
        };

        const renderState = (message) => {
            if (state) {
                state.hidden = false;
                state.innerHTML = `<p>${message}</p>`;
            }

            if (track) {
                track.hidden = true;
            }

            if (controls) {
                controls.hidden = true;
            }
        };

        const renderCarousel = (payload) => {
            events = Array.isArray(payload.events) ? payload.events : [];

            if (events.length === 0) {
                renderState('Ahora mismo no hay eventos listados. Puedes comprobar Triocio directamente para nuevas publicaciones.');
                if (status) {
                    status.textContent = 'No hay eventos disponibles en la ultima sincronizacion.';
                }
                return;
            }

            if (track) {
                track.innerHTML = events.map(buildSlide).join('');
                track.hidden = false;
            }

            if (state) {
                state.hidden = true;
            }

            if (dots) {
                dots.innerHTML = events
                    .map((_, index) => `<button type="button" class="events-carousel-dot${index === 0 ? ' active' : ''}" aria-label="Ir al evento ${index + 1}" data-index="${index}"></button>`)
                    .join('');

                Array.from(dots.children).forEach((dot) => {
                    dot.addEventListener('click', () => {
                        goToSlide(Number(dot.getAttribute('data-index')));
                        startAutoplay();
                    });
                });
            }

            if (controls) {
                controls.hidden = false;
            }

            if (status) {
                status.textContent = `Ultima sincronizacion: ${formatUpdatedAt(payload.updatedAt)}. Fuente: Triocio.`;
            }

            currentIndex = 0;
            goToSlide(0);
            startAutoplay();
        };

        const loadEvents = async () => {
            renderState('Cargando eventos desde Triocio...');

            try {
                const response = await fetch(endpoint, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error('No se pudo obtener el feed de eventos.');
                }

                const payload = await response.json();
                renderCarousel(payload);
            } catch (error) {
                renderState('No hemos podido cargar el carrusel ahora mismo. Puedes abrir Triocio directamente mientras reintentamos.');
                if (status) {
                    status.textContent = 'Error al consultar los eventos sincronizados.';
                }
            }
        };

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                goToSlide(currentIndex - 1);
                startAutoplay();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                goToSlide(currentIndex + 1);
                startAutoplay();
            });
        }

        if (stage) {
            stage.addEventListener('mouseenter', stopAutoplay);
            stage.addEventListener('mouseleave', startAutoplay);
        }

        loadEvents();
    }

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
