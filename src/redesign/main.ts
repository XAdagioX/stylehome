/* StyleHomes redesign entry — bundles the design-system CSS (in cascade
   order) and the interaction layer. Referenced by index.html and the
   redesigned service subpages via <script type="module">. Fonts load
   via <link> in the page <head> (preconnect + font-display: swap). */
import './colors.css';
import './typography.css';
import './spacing.css';
import './elevation.css';
import './base.css';
import './layout.css';
import './components.css';
import './site.css';

import './app';
