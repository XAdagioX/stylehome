// Module for initializing Footer sections

import { insertFooter, updateFooter, type FooterConfig, type FooterLink } from '../components/Footer';

/**
 * Get current path (e.g., '', 'kitchen-renovation') — no .html in URL
 */
function getCurrentPath(): string {
  const path = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '');
  return path;
}

/**
 * Check if current page is the main index page
 */
function isMainPage(): boolean {
  const path = getCurrentPath();
  return path === '' || path === 'index';
}

/**
 * Normalize Quick Links hrefs - use /#anchor for anchor links on non-main pages (clean URL)
 */
function normalizeQuickLinks(quickLinks: FooterLink[]): FooterLink[] {
  const isMain = isMainPage();
  
  return quickLinks.map(link => {
    if (link.href.startsWith('#') && !isMain) {
      return {
        ...link,
        href: `/${link.href}`
      };
    }
    return link;
  });
}

/**
 * Default Footer configuration
 */
const defaultFooterConfig: FooterConfig = {
  logo: {
    src: 'img/logo-red.svg',
    alt: 'Style Homes Logo'
  },
  contacts: [
    {
      text: 'Washington License: STYLEHL751CS',
      href: 'https://secure.lni.wa.gov/verify/Detail.aspx?UBI=605394148&LIC=STYLEHL751CS&SAW=',
      target: '_blank'
    },
    {
      text: 'Oregon CCB: 259642',
      href: 'https://search.ccb.state.or.us/search/list_results.aspx',
      target: '_blank'
    },
    {
      text: '+1 (360) 859 6482',
      href: 'tel:+13608596482'
    }
  ],
  socials: [
    {
      href: 'https://www.instagram.com/style_homes_usa',
      iconSrc: 'img/social_ico/instagram.avif',
      alt: 'Instagram',
      target: '_blank'
    },
    {
      href: 'https://www.facebook.com/share/1ByVWrAJbJ/?mibextid=wwXIfr',
      iconSrc: 'img/social_ico/facebook.svg',
      alt: 'Facebook',
      target: '_blank'
    },
    {
      href: 'https://www.thumbtack.com/wa/vancouver/general-contractors/style-homes-llc/service/542227943368220678',
      iconSrc: 'img/social_ico/thumbtack.avif',
      alt: 'Thumbtack',
      target: '_blank'
    }
  ],
  quickLinks: [
    { text: 'Home', href: '#hero' },
    { text: 'Services', href: '#services' },
    { text: 'Projects', href: '#projects' },
    { text: 'About', href: '#about' },
    { text: 'Get Free Quote', href: '#consultation' },
    { text: 'FAQ', href: '#faq' }
  ],
  serviceAreas: [
    'Portland, OR +50 miles',
    'Vancouver, WA +50 miles'
  ],
  ourServices: [
    { text: 'Wood and Panel Wall Decor', href: '/wood-and-panel-wall-decor' },
    { text: 'Kitchen Renovation', href: '/kitchen-renovation' },
    { text: 'Bathroom Renovation', href: '/bathroom-renovation' },
    { text: 'Whole-Home Transformation', href: '/whole-home-transformation' }
  ],
  copyright: '© Style Homes 2025'
};

/**
 * Initialize Footer section on current page
 */
export function initFooter(): void {
  const existingFooter = document.querySelector<HTMLElement>('.footer');
  
  // Normalize quick links based on current page
  const normalizedConfig: FooterConfig = {
    ...defaultFooterConfig,
    quickLinks: normalizeQuickLinks(defaultFooterConfig.quickLinks)
  };
  
  if (existingFooter) {
    // If footer already exists, update it via updateFooter
    updateFooter(existingFooter, normalizedConfig);
  } else {
    // If footer doesn't exist, insert new one
    const body = document.querySelector<HTMLElement>('body');
    if (body) {
      insertFooter(body, normalizedConfig);
    }
  }
}

/**
 * Initialize Footer with custom configuration
 */
export function initFooterWithConfig(config: FooterConfig): void {
  const body = document.querySelector<HTMLElement>('body');
  if (body) {
    insertFooter(body, config);
  }
}
