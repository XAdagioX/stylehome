# Style Homes Website

Modern website for Style Homes — a kitchen and bathroom remodeling company serving Portland OR & Vancouver WA.

## 🚀 Quick Start

### Requirements

- Node.js 18+ and npm
- Java 17+ (for backend)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:8000`

### Production Build

```bash
# Build the project
npm run build

# Preview the built project
npm run preview
```

## 📁 Project Structure

```
stylehome_new/
├── src/                    # TypeScript source files
│   ├── components/         # Reusable components (Hero, Footer, Carousel)
│   ├── modules/           # Feature modules (navigation, animations, etc.)
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── main.ts            # Application entry point
│   └── style.css          # Main stylesheet
├── public/                # Static assets (images, video, libraries)
│   ├── img/              # Images
│   ├── video/            # Video files
│   └── js/libs/          # Third-party libraries (AOS, Anime.js)
├── backend/              # Spring Boot backend API
│   ├── src/main/java/   # Java source code
│   └── pom.xml          # Maven configuration
├── index.html           # Home page
├── kitchen-renovation.html
├── bathroom-renovation.html
├── wood-and-panel-wall-decor.html
├── whole-home-transformation.html
├── vite.config.ts       # Vite configuration
└── package.json         # Node.js dependencies
```

## 🛠️ Technologies

### Frontend

- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **HTML5 & CSS3** - Modern web standards
- **AOS (Animate On Scroll)** - Scroll-triggered animations
- **Anime.js** - Advanced animations

### Backend

- **Java 17** - Programming language
- **Spring Boot 3.2** - Application framework
- **Spring Data JPA** - Database access
- **PostgreSQL / H2** - Database (H2 for development, PostgreSQL for production)
- **Flyway** - Database migrations

## 📄 Pages

- **Home** (`index.html`) - Main landing page
- **Kitchen Renovation** (`kitchen-renovation.html`)
- **Bathroom Renovation** (`bathroom-renovation.html`)
- **Wood and Panel Wall Decor** (`wood-and-panel-wall-decor.html`)
- **Whole-Home Transformation** (`whole-home-transformation.html`)

## 🎯 Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Smooth scroll navigation
- ✅ Animated hero section with video background
- ✅ Project galleries with carousels
- ✅ Consultation form
- ✅ Testimonials section
- ✅ FAQ accordion
- ✅ Backend API for form submission

## 🔧 Development

### Frontend Development

```bash
# Start dev server with hot reload
npm run dev

# Type checking
npm run type-check

# Production build
npm run build
```

### Backend Development

```bash
cd backend

# Run with Maven
mvn spring-boot:run

# Or build and run JAR
mvn clean package
java -jar target/stylehome-backend-1.0.0.jar
```

Backend API will be available at `http://localhost:8080/api`

## 📦 Deployment

The project is configured for deployment on GitHub Pages:
- Base path: `/stylehome-wix-clone/`
- Automatic deployment via GitHub Actions
- Build output: `dist/` directory

## 🔗 Links

- **Live site**: [GitHub Pages](https://largoscript.github.io/stylehome-wix-clone/)
- **Repository**: [GitHub](https://github.com/LargoScript/stylehome-wix-clone)

## 📝 Notes

- All code comments are in English
- Images are optimized (WebP/AVIF where possible)
- Backend is optional — frontend works standalone
- Form submission requires a running backend API

## 📄 License

ISC
