// Navigation module - smooth scroll, active nav link, auto burger menu

import { querySelector, querySelectorAll } from '../utils/dom';
import { scrollToElement, scrollToTop } from '../utils/scroll';
import type { CloseMenuFunction, CheckCollisionFunction } from '../types/navigation';

// Global variables for interaction between modules
export let closeMenuFunction: CloseMenuFunction | null = null;
export let checkElementsCollision: CheckCollisionFunction | null = null;

/**
 * Initialize automatic show/hide burger menu
 */
export function initAutoBurgerMenu(): void {
  const nav = querySelector<HTMLElement>('.header__nav');
  const actions = querySelector<HTMLElement>('.header__actions');
  const burger = querySelector<HTMLElement>('.header__burger');
  const header = querySelector<HTMLElement>('.header');
  
  if (!nav || !actions || !burger || !header) return;

  checkElementsCollision = function(): void {
    // Not check, if menu open
    const isMenuOpen = nav.classList.contains('active');
    if (isMenuOpen) {
      return;
    }

    // Check only on desktop (width > 850px)
    if (window.innerWidth <= 850) {
      (burger as HTMLElement).style.display = 'flex';
      if (!isMenuOpen) {
        nav.style.display = 'none';
      }
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    
    const gap = actionsRect.left - navRect.right;
    const isTouching = gap <= 0;
    
    requestAnimationFrame(() => {
      if (nav.classList.contains('active')) {
        return;
      }
      
      if (isTouching) {
        nav.style.display = 'none';
        burger.style.display = 'flex';
        header.classList.add('burger-mode');
      } else {
        burger.style.display = 'none';
        nav.style.display = 'flex';
        header.classList.remove('burger-mode');
      }
    });
  };

  // Check on load
  checkElementsCollision();

  // Check on resize
  let resizeRequestId: number | null = null;
  window.addEventListener('resize', () => {
    if (resizeRequestId) {
      cancelAnimationFrame(resizeRequestId);
    }
    resizeRequestId = requestAnimationFrame(() => {
      if (checkElementsCollision) {
        checkElementsCollision();
      }
    });
  });

  // Check on scroll
  let scrollRequestId: number | null = null;
  window.addEventListener('scroll', () => {
    if (nav.classList.contains('active')) {
      return;
    }
    
    if (scrollRequestId) {
      cancelAnimationFrame(scrollRequestId);
    }
    scrollRequestId = requestAnimationFrame(() => {
      if (checkElementsCollision) {
        checkElementsCollision();
      }
    });
  });
}

/**
 * Initialize smooth scroll navigation
 */
export function initSmoothScroll(): void {
  const navLinks = querySelectorAll<HTMLAnchorElement>('.header__nav-link[href^="#"]');
  const header = querySelector<HTMLElement>('.header');
  const nav = querySelector<HTMLElement>('.header__nav');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e: MouseEvent) => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Skip empty anchors
      if (href === '#' || href === '#hero') {
        e.preventDefault();
        
        if (nav && nav.classList.contains('active') && closeMenuFunction) {
          closeMenuFunction();
        }
        
        setTimeout(() => {
          scrollToTop();
        }, nav && nav.classList.contains('active') ? 150 : 0);
        return;
      }
      
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        e.preventDefault();
        
        if (nav && nav.classList.contains('active') && closeMenuFunction) {
          closeMenuFunction();
        }
        
        setTimeout(() => {
          const headerHeight = header ? header.offsetHeight : 80;
          scrollToElement(targetElement as HTMLElement, headerHeight);
        }, nav && nav.classList.contains('active') ? 150 : 0);
      }
    });
  });
}

/**
 * Initialize active link update on scroll
 */
export function initActiveNavLink(): void {
  const sections = querySelectorAll<HTMLElement>('section[id]');
  const navLinks = querySelectorAll<HTMLAnchorElement>('.header__nav-link[href^="#"]');
  const header = querySelector<HTMLElement>('.header');
  const headerHeight = header ? header.offsetHeight : 80;
  
  const updateActiveLink = (): void => {
    let current = '';
    const scrollY = window.pageYOffset;
    const windowHeight = window.innerHeight;
    
    // If we are at the top of page, active is hero
    if (scrollY < 100) {
      current = 'hero';
    } else {
      // Check all sections to find current one
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const sectionId = section.getAttribute('id');
        
        if (sectionId) {
          // Section is considered active if its top is above screen middle
          // or if it occupies most of the screen
          const sectionTop = rect.top;
          const sectionBottom = rect.bottom;
          const viewportMiddle = windowHeight / 2;
          
          // If section top is above screen middle and section is visible
          if (sectionTop <= viewportMiddle && sectionBottom > 0) {
            current = sectionId;
          }
        }
      });
    }
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      
      // Check different href variants
      if (href === `#${current}` || 
          (current === 'hero' && (href === '#' || href === '#hero'))) {
        link.classList.add('active');
      }
    });
  };
  
  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
}

/**
 * Initialize mobile menu (burger)
 */
export function initMobileMenu(): void {
  const burger = querySelector<HTMLElement>('.header__burger');
  const nav = querySelector<HTMLElement>('.header__nav');
  const header = querySelector<HTMLElement>('.header');
  
  if (!burger || !nav || !header) return;

  // Make sure menu always starts in closed state
  burger.classList.remove('active');
  nav.classList.remove('active');
  if (burger instanceof HTMLButtonElement) {
    burger.setAttribute('aria-expanded', 'false');
  }
  document.body.style.overflow = '';
  
  const closeMenuWithoutAnimation = (): void => {
    document.body.classList.add('no-transition');
    burger.classList.remove('active');
    nav.classList.remove('active');
    if (burger instanceof HTMLButtonElement) {
      burger.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
    setTimeout(() => {
      document.body.classList.remove('no-transition');
    }, 50);
  };
  
  burger.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const isActive = burger.classList.contains('active');
    header.classList.remove('burger-mode');
    
    burger.classList.toggle('active');
    nav.classList.toggle('active');
    if (burger instanceof HTMLButtonElement) {
      burger.setAttribute('aria-expanded', String(!isActive));
    }
    
    if (!isActive) {
      nav.style.display = '';
      nav.style.visibility = '';
      nav.style.opacity = '';
      nav.style.transform = '';
      
      nav.style.display = 'flex';
      nav.style.visibility = 'visible';
      nav.style.opacity = '1';
      nav.style.transform = 'translateX(0)';
      
      document.body.style.overflow = 'hidden';
    } else {
      nav.style.transform = 'translateX(-100%)';
      nav.style.opacity = '0';
      nav.style.visibility = 'hidden';
      document.body.style.overflow = '';
      
      setTimeout(() => {
        if (!nav.classList.contains('active')) {
          nav.style.display = '';
        }
        if (checkElementsCollision) {
          checkElementsCollision();
        }
      }, 300);
    }
  });
  
  const closeMenu = (): void => {
    burger.classList.remove('active');
    nav.classList.remove('active');
    if (burger instanceof HTMLButtonElement) {
      burger.setAttribute('aria-expanded', 'false');
    }
    
    nav.style.transform = 'translateX(-100%)';
    nav.style.opacity = '0';
    nav.style.visibility = 'hidden';
    document.body.style.overflow = '';
    
    setTimeout(() => {
      if (!nav.classList.contains('active')) {
        nav.style.display = '';
      }
      if (checkElementsCollision) {
        checkElementsCollision();
      }
    }, 300);
  };
  
  closeMenuFunction = closeMenu;
  
  // Close menu on cross click
  const navClose = querySelector<HTMLElement>('.header__nav-close', nav);
  if (navClose) {
    navClose.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      closeMenu();
    });
  }
  
  // Close menu on click outside menu
  nav.addEventListener('click', (e: MouseEvent) => {
    if (e.target === nav) {
      closeMenu();
    }
  });
  
  // Use matchMedia to detect media query change
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  
  const handleMediaChange = (e: MediaQueryListEvent): void => {
    if (!e.matches) {
      if (nav.classList.contains('active')) {
        closeMenuWithoutAnimation();
      }
    }
  };
  
  mediaQuery.addEventListener('change', handleMediaChange);
  
  // Handle resize
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let isResizing = false;
  
  window.addEventListener('resize', () => {
    if (!isResizing) {
      document.body.classList.add('no-transition');
      isResizing = true;
    }
    
    if (window.innerWidth > 768) {
      if (nav.classList.contains('active')) {
        burger.classList.remove('active');
        nav.classList.remove('active');
        if (burger instanceof HTMLButtonElement) {
          burger.setAttribute('aria-expanded', 'false');
        }
        document.body.style.overflow = '';
      }
    }
    
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      document.body.classList.remove('no-transition');
      isResizing = false;
    }, 100);
  });
  
  // Check initial state
  if (window.innerWidth > 768) {
    closeMenuWithoutAnimation();
  }
}
