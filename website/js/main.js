// DOM Elements
const header = document.querySelector('.header');
const nav = document.querySelector('.nav');
const floatingCta = document.querySelector('.floating-cta');

// Mobile Menu Setup
function setupMobileMenu() {
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'nav__mobile-menu';
    mobileMenuBtn.innerHTML = `
        <span class="menu-icon"></span>
        <span class="sr-only">Toggle Menu</span>
    `;
    nav.insertBefore(mobileMenuBtn, nav.firstChild);

    mobileMenuBtn.addEventListener('click', () => {
        nav.classList.toggle('nav--open');
        mobileMenuBtn.classList.toggle('nav__mobile-menu--open');
        document.body.classList.toggle('menu-open');
    });
}

// Smooth Scrolling
function enableSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Sticky Header with Hide/Show on Scroll
function handleStickyHeader() {
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            // At the top of the page
            header.classList.remove('header--hidden');
        } else {
            if (currentScroll > lastScrollTop && !header.classList.contains('header--hidden')) {
                // Scrolling down, hide header
                header.classList.add('header--hidden');
            } else if (currentScroll < lastScrollTop && header.classList.contains('header--hidden')) {
                // Scrolling up, show header
                header.classList.remove('header--hidden');
            }
        }
        
        lastScrollTop = currentScroll;
    });
}

// Carousel Functionality
function setupCarousel() {
    const carousel = document.querySelector('.carousel-container');
    
    // Only setup carousel if the carousel container exists on the page
    if (!carousel) return;
    
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    // Make sure all required elements exist
    if (!slides.length || !dots.length || !prevBtn || !nextBtn) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    // Show the first slide initially
    showSlide(currentSlide);
    
    // Handle previous button click
    prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    });
    
    // Handle next button click
    nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    });
    
    // Handle dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });
    
    // Function to display the current slide
    function showSlide(index) {
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Auto-advance the carousel every 5 seconds
    setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }, 5000);
}

// Floating CTA handling
function handleFloatingCTA() {
    if (!floatingCta) return;
    
    let ticking = false;
    let scrollY;
    
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const heroSection = document.querySelector('.hero');
                
                // Only proceed if hero section exists
                if (heroSection) {
                    const heroHeight = heroSection.offsetHeight;
                    
                    // Show floating CTA only after scrolling past the hero section
                    floatingCta.classList.toggle('floating-cta--visible', scrollY > heroHeight);
                }
                
                ticking = false;
            });
            
            ticking = true;
        }
    });
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification notification--' + type;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Add visible class after a small delay to trigger animation
    setTimeout(() => notification.classList.add('notification--visible'), 100);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('notification--visible');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Initialize all functionality
function initialize() {
    setupMobileMenu();
    enableSmoothScrolling();
    handleStickyHeader();
    setupCarousel();
    handleFloatingCTA();
}

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize); 