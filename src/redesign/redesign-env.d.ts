// Ambient declarations for the redesign entry.
// CSS side-effect imports (mirrors how the legacy entry imports style.css).
declare module '*.css';

// gtag is injected by the Google tag snippet in the page <head>.
interface Window {
  gtag?: (...args: unknown[]) => void;
  BACKEND_URL?: string;
}
