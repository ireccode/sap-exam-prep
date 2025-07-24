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

// --- AI-Powered Search Bar Logic ---

const searchInput = document.getElementById('ai-search-input');
const suggestionsBox = document.getElementById('search-suggestions');

// Import topic cluster index
import { CONTENT_INDEX } from './content-index.js';

// Flatten content index for search
function flattenContentIndex(contentIndex) {
  const flat = [];
  for (const pillar of contentIndex) {
    for (const cluster of pillar.clusters) {
      for (const item of cluster.items) {
        flat.push({
          ...item,
          pillar: pillar.pillar,
          pillarId: pillar.id,
          cluster: cluster.name,
          clusterId: cluster.id,
          keywords: item.tags || [],
        });
      }
    }
  }
  return flat;
}

const SEARCH_INDEX = flattenContentIndex(CONTENT_INDEX);


function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function fuzzyMatch(query, target) {
  // Basic typo tolerance: check for inclusion, 1-char missing, or swapped
  if (target.includes(query)) return true;
  if (Math.abs(target.length - query.length) > 2) return false;
  let mismatches = 0;
  for (let i = 0, j = 0; i < query.length && j < target.length;) {
    if (query[i] === target[j]) {
      i++; j++;
    } else {
      mismatches++;
      if (mismatches > 1) return false;
      if (query.length > target.length) i++;
      else if (query.length < target.length) j++;
      else { i++; j++; }
    }
  }
  return true;
}

function getSuggestions(query) {
  const normQuery = normalize(query);
  if (!normQuery) return [];
  // Predict intent: exam, guide, faq, article
  return SEARCH_INDEX.filter(item =>
    item.keywords.some(kw => fuzzyMatch(normQuery, normalize(kw))) ||
    fuzzyMatch(normQuery, normalize(item.title))
  ).slice(0, 8);
}

function renderSuggestions(suggestions) {
  if (!suggestions.length) {
    suggestionsBox.classList.remove('active');
    suggestionsBox.innerHTML = '';
    return;
  }
  suggestionsBox.classList.add('active');
  suggestionsBox.innerHTML = suggestions.map(s =>
    `<div class="search-bar__suggestion" tabindex="0" data-url="${s.url}">
      <span class="search-bar__suggestion-type">${s.type}</span> ${s.title}
      <div class="search-bar__suggestion-meta">
        <span class="search-bar__suggestion-pillar">${s.pillar}</span>
        <span class="search-bar__suggestion-cluster">${s.cluster}</span>
      </div>
    </div>`
  ).join('');
}

if (searchInput) {
  let debounceTimeout;
  searchInput.addEventListener('input', e => {
    clearTimeout(debounceTimeout);
    const query = e.target.value;
    debounceTimeout = setTimeout(() => {
      if (!query.trim()) {
        renderSuggestions([]);
        return;
      }
      const suggestions = getSuggestions(query);
      renderSuggestions(suggestions);
    }, 120);
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestionsBox.classList.contains('active')) {
        const first = suggestionsBox.querySelector('.search-bar__suggestion');
        if (first) first.click();
      } else {
        // Natural language question mode
        handleAiQuestion(searchInput.value);
      }
    }
  });
}

if (suggestionsBox) {
  suggestionsBox.addEventListener('mousedown', e => {
    const target = e.target.closest('.search-bar__suggestion');
    if (target && target.dataset.url) {
      window.location.href = target.dataset.url;
    }
  });
}

function handleAiQuestion(question) {
  // Placeholder: In production, call AI backend or API
  renderSuggestions([]);
  showNotification('AI answer: (This would show a smart answer or SAP doc reference for: ' + question + ')', 'info');
}

// --- End AI Search Bar Logic ---

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize); 