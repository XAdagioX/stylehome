import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function findHtmlFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

import type { ViteDevServer, Plugin } from 'vite';
import type { ServerResponse, IncomingMessage } from 'http';

// Fix Windows MIME type plugin (Windows treats .ts as video, .tsx as octet-stream)
function fixTsMimeType(): Plugin {
  return {
    name: 'fix-ts-mime-type',
    enforce: 'pre',
    configureServer(server: ViteDevServer) {
      // Monkey-patch the writeHead method to fix MIME types
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        if (url.match(/\.tsx?($|\?)/)) {
          const originalWriteHead = res.writeHead.bind(res);
          // @ts-ignore - overloading writeHead
          res.writeHead = function(statusCode: number, statusMessage?: string | object, headers?: object) {
            // Force Content-Type for TypeScript files
            if (typeof statusMessage === 'object') {
              headers = statusMessage;
              statusMessage = undefined;
            }
            const finalHeaders = { ...headers as object, 'Content-Type': 'application/javascript; charset=utf-8' };
            if (statusMessage) {
              return originalWriteHead(statusCode, statusMessage as string, finalHeaders);
            }
            return originalWriteHead(statusCode, finalHeaders);
          };
        }
        next();
      });
    }
  };
}

export default defineConfig({
  // For VPS hosting, use root path '/'
  // For GitHub Pages, change to '/stylehome-wix-clone/'
  base: '/',
  server: {
    host: '0.0.0.0', // Allow access from network
    port: 8000,
    strictPort: true,
    open: true,
    // Fix Windows MIME type issue: .ts = video/vnd.dlna.mpeg-tts
    fs: {
      strict: false
    }
  },
  // Force esbuild to handle TypeScript
  esbuild: {
    loader: 'tsx',
    include: /\.(ts|tsx|mjs)$/,
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    assetsInlineLimit: 0, // Don't inline assets - keep them as separate files for proper base path handling
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        kitchen: resolve(__dirname, 'kitchen-renovation.html'),
        bathroom: resolve(__dirname, 'bathroom-renovation.html'),
        woodPanel: resolve(__dirname, 'wood-and-panel-wall-decor.html'),
        wholeHome: resolve(__dirname, 'whole-home-transformation.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@types': resolve(__dirname, 'src/types'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@components': resolve(__dirname, 'src/components')
    }
  },
  plugins: [
    // Fix Windows MIME type for .ts files
    fixTsMimeType(),
    // Plugin to remove .html extensions from links (for clean URLs with Nginx)
    {
      name: 'remove-html-extensions',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const htmlFiles = findHtmlFiles(distDir);
        console.log(`[remove-html-extensions] Found ${htmlFiles.length} HTML files to process`);
        htmlFiles.forEach(file => {
          let content = readFileSync(file, 'utf-8');
          const originalContent = content;
          
          // Replace href="index.html" with href="/"
          content = content.replace(/href="index\.html"/g, 'href="/"');
          
          // Replace href="index.html#section" with href="/#section"
          content = content.replace(/href="index\.html#([^"]+)"/g, 'href="/#$1"');
          
          // Replace href="something.html" with href="/something"
          content = content.replace(/href="([a-zA-Z0-9_-]+)\.html"/g, 'href="/$1"');
          
          // Replace href="something.html#section" with href="/something#section"
          content = content.replace(/href="([a-zA-Z0-9_-]+)\.html#([^"]+)"/g, 'href="/$1#$2"');
          
          if (content !== originalContent) {
            writeFileSync(file, content, 'utf-8');
            console.log(`[remove-html-extensions] Updated ${file}`);
          }
        });
      }
    }
    // Plugin for GitHub Pages base path (disabled for VPS)
    // Uncomment if deploying to GitHub Pages
    /*
    {
      name: 'add-base-path',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const htmlFiles = findHtmlFiles(distDir);
        console.log(`[add-base-path] Found ${htmlFiles.length} HTML files to process`);
        htmlFiles.forEach(file => {
          let content = readFileSync(file, 'utf-8');
          const originalContent = content;
          content = content.replace(
            /(src|href)="(?!https?:\/\/|\/|#|tel:|mailto:|data:)([^"]+)"/g,
            (match, attr, path) => {
              if (path.startsWith('/stylehome-wix-clone/') || path.startsWith('http') || path.startsWith('tel:') || path.startsWith('mailto:') || path.startsWith('data:')) {
                return match;
              }
              return `${attr}="/stylehome-wix-clone/${path}"`;
            }
          );
          if (content !== originalContent) {
            writeFileSync(file, content, 'utf-8');
            console.log(`[add-base-path] Updated ${file}`);
          }
        });
        const nojekyllPath = join(distDir, '.nojekyll');
        writeFileSync(nojekyllPath, '', 'utf-8');
        console.log(`[add-base-path] Created .nojekyll file`);
      }
    }
    */
  ]
});
