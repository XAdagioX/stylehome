// Main TypeScript entry file
import './style.css';

// Import modules
import { initHeaderScroll, initServicesDarkening } from './modules/header';
import {
  initAutoBurgerMenu,
  initSmoothScroll,
  initActiveNavLink,
  initMobileMenu
} from './modules/navigation';
import { initAnimations } from './modules/animations';
import { initCarousels } from './modules/carousel';
import { initTestimonials } from './modules/testimonials';
import { initFAQ } from './modules/faq';
import { initForm } from './modules/form';
import { initBackgroundEffects } from './modules/background-effects';
import { initHero } from './modules/hero';
import { initFooter } from './modules/footer';

console.log('Style Homes website loaded');

// Hide page loader when content is ready
function hidePageLoader() {
  const loader = document.getElementById('pageLoader');
  if (loader) {
    loader.classList.add('hidden');
    // Remove from DOM after transition
    setTimeout(() => {
      loader.remove();
    }, 500);
  }
}

// Initialize all modules
document.addEventListener('DOMContentLoaded', () => {
  // Initialize smooth video start (only on first load)
  const heroVideo = document.querySelector<HTMLVideoElement>('.hero__video');
  if (heroVideo) {
    let hasStartedSmooth = false;
    
    // Start with slow playback rate
    heroVideo.playbackRate = 0.3;
    
    // When video is ready to play, smoothly increase speed
    const smoothStart = () => {
      if (hasStartedSmooth) return;
      hasStartedSmooth = true;
      
      const startRate = 0.3;
      const endRate = 1.0;
      const duration = 2000; // 2 seconds
      const startTime = performance.now();
      
      const animateSpeed = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        heroVideo.playbackRate = startRate + (endRate - startRate) * easeProgress;
        
        if (progress < 1) {
          requestAnimationFrame(animateSpeed);
        }
      };
      
      requestAnimationFrame(animateSpeed);
    };
    
    // Listen for canplay event (video ready)
    heroVideo.addEventListener('canplay', smoothStart, { once: true });
    
    // Fallback: if video already loaded
    if (heroVideo.readyState >= 3) {
      smoothStart();
    }
  }
  
  // CRITICAL: Ensure header and all its children are visible immediately
  // This prevents any CSS/JS issues from hiding content
  const header = document.querySelector<HTMLElement>('.header');
  if (header) {
    header.style.opacity = '1';
    header.style.visibility = 'visible';
    header.style.display = 'block';
  }
  
  // Ensure all header children are visible
  const headerElements = document.querySelectorAll<HTMLElement>('.header__logo, .header__nav, .header__actions, .header__burger');
  headerElements.forEach(el => {
    el.style.opacity = '1';
    el.style.visibility = 'visible';
  });
  
  // Additional safety: force visibility after a short delay
  setTimeout(() => {
    if (header) {
      header.style.opacity = '1';
      header.style.visibility = 'visible';
    }
    headerElements.forEach(el => {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
    });
  }, 100);
  
  // Initialize header scroll effect
  initHeaderScroll();
  
  // Initialize services darkening effect
  initServicesDarkening();
  
  // Initialize auto burger menu (must be before initSmoothScroll)
  initAutoBurgerMenu();
  
  // Initialize mobile menu
  initMobileMenu();
  
  // Initialize smooth scroll navigation (after initAutoBurgerMenu)
  setTimeout(() => {
    initSmoothScroll();
  }, 0);
  
  // Initialize active nav link on scroll
  initActiveNavLink();
  
  // Initialize animations (wait for AOS and anime.js to be loaded)
  const waitForScripts = () => {
    // Check if scripts are loaded, with timeout
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    const checkScripts = () => {
      attempts++;
      const aosLoaded = typeof window.AOS !== 'undefined';
      const animeLoaded = typeof window.anime !== 'undefined';
      
      if (aosLoaded && animeLoaded) {
        // Both scripts loaded, initialize animations
        initAnimations();
      } else if (attempts < maxAttempts) {
        // Scripts not loaded yet, wait a bit more
        setTimeout(checkScripts, 100);
      } else {
        // Timeout reached, initialize anyway (fallback will handle it)
        console.warn('AOS or anime.js not loaded after timeout, initializing with fallback');
  initAnimations();
      }
    };
    
    checkScripts();
  };
  
  waitForScripts();
  
  // Initialize carousels
  initCarousels();
  
  // Initialize testimonials
  initTestimonials();
  
  // Initialize FAQ
  initFAQ();
  
  // Initialize form
  initForm();
  
  // Initialize background effects
  initBackgroundEffects();
  
  // Initialize hero section (can update existing if needed)
  // initHero(); // Uncomment if you need to dynamically update Hero
  
  // Initialize footer section
  initFooter();
  
  // Hide page loader after a small delay to ensure CSS is loaded
  setTimeout(() => {
    hidePageLoader();
  }, 300);
});
