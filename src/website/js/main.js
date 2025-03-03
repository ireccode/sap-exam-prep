// DOM Elements
const header = document.querySelector('.header');
const nav = document.querySelector('.nav');
const mobileMenuBtn = document.createElement('button');
const contactForm = document.getElementById('contactForm');
const floatingCta = document.querySelector('.floating-cta');

// Mobile Menu Setup
function setupMobileMenu() {
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

// Sticky Header
function handleStickyHeader() {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('header--hidden');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('header--hidden')) {
            // Scrolling down
            header.classList.add('header--hidden');
        } else if (currentScroll < lastScroll && header.classList.contains('header--hidden')) {
            // Scrolling up
            header.classList.remove('header--hidden');
        }
        
        lastScroll = currentScroll;
    });
}

// Lazy Loading Images
function setupLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
        // Browser supports native lazy loading
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const lazyLoadScript = document.createElement('script');
        lazyLoadScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/lozad.js/1.16.0/lozad.min.js';
        document.body.appendChild(lazyLoadScript);

        lazyLoadScript.onload = function() {
            const observer = lozad();
            observer.observe();
        };
    }
}

// Form Handling
function setupFormHandling() {
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                // Replace with your actual API endpoint
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    showNotification('Message sent successfully!', 'success');
                    contactForm.reset();
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                showNotification('Failed to send message. Please try again.', 'error');
                console.error('Form submission error:', error);
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('notification--visible'), 100);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('notification--visible');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Floating CTA Visibility
function handleFloatingCTA() {
    if (floatingCta) {
        let lastScroll = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            lastScroll = window.scrollY;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // Show CTA after scrolling past hero section
                    const heroHeight = document.querySelector('.hero').offsetHeight;
                    floatingCta.classList.toggle('floating-cta--visible', lastScroll > heroHeight);
                    ticking = false;
                });

                ticking = true;
            }
        });
    }
}

// Analytics
function setupAnalytics() {
    // Track CTA clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const btnText = btn.textContent.trim();
            gtag('event', 'click', {
                'event_category': 'CTA',
                'event_label': btnText
            });
        });
    });

    // Track form submissions
    if (contactForm) {
        contactForm.addEventListener('submit', () => {
            gtag('event', 'submit', {
                'event_category': 'Form',
                'event_label': 'Contact Form'
            });
        });
    }
}

// Initialize
function initialize() {
    setupMobileMenu();
    enableSmoothScrolling();
    handleStickyHeader();
    setupLazyLoading();
    setupFormHandling();
    handleFloatingCTA();
    setupAnalytics();
}

document.addEventListener('DOMContentLoaded', initialize);

// Add CSS styles for JavaScript-dependent features
const styles = `
    .header--hidden {
        transform: translateY(-100%);
    }

    .nav__mobile-menu {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--spacing-sm);
    }

    .menu-icon {
        display: block;
        width: 24px;
        height: 2px;
        background-color: var(--color-text);
        position: relative;
        transition: background-color var(--transition-fast);
    }

    .menu-icon::before,
    .menu-icon::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: var(--color-text);
        transition: transform var(--transition-fast);
    }

    .menu-icon::before { transform: translateY(-6px); }
    .menu-icon::after { transform: translateY(6px); }

    .nav__mobile-menu--open .menu-icon {
        background-color: transparent;
    }

    .nav__mobile-menu--open .menu-icon::before {
        transform: rotate(45deg);
    }

    .nav__mobile-menu--open .menu-icon::after {
        transform: rotate(-45deg);
    }

    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--border-radius-md);
        background-color: white;
        box-shadow: var(--shadow-lg);
        transform: translateY(100%);
        opacity: 0;
        transition: all var(--transition-normal);
        z-index: 1100;
    }

    .notification--success {
        border-left: 4px solid #28a745;
    }

    .notification--error {
        border-left: 4px solid #dc3545;
    }

    .notification--visible {
        transform: translateY(0);
        opacity: 1;
    }

    .floating-cta {
        opacity: 0;
        transform: translateY(100%);
        transition: all var(--transition-normal);
    }

    .floating-cta--visible {
        opacity: 1;
        transform: translateY(0);
    }

    @media (max-width: 768px) {
        .nav__mobile-menu {
            display: block;
        }

        .nav__menu {
            display: none;
        }

        .nav--open .nav__menu {
            display: flex;
        }

        .menu-open {
            overflow: hidden;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet); 