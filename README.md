# Cine Explorer

A state-of-the-art, "Awwwards-level" movie and TV show discovery web application built with a modern, serverless architecture. This project was developed entirely on Android devices, using no local build tools or dependencies, showcasing a pure HTML, CSS, and Vanilla JavaScript workflow.

**Live Demo:** [**pbmmovie.netlify.app**](https://pbmmovie.netlify.app/)



## Core Features

Cine Explorer is designed to provide a seamless, fluid, and visually stunning user experience, rivaling top-tier streaming services.

*   **Cinematic Hero Section:**
    *   Features the top 7 trending movies and TV shows.
    *   Slow, captivating Ken Burns effect on the backdrop images.
    *   Displays the official title logo with a fallback to a stylized text title.
    *   Dynamic tagline and a functional "Watch Now" button.
    *   Interactive, auto-playing progress bar indicators.
    *   Full swipe support for mobile navigation.

*   **"Awwwards-Level" Search Overlay:**
    *   An immersive full-screen overlay with a "glassmorphism" effect.
    *   The background page smoothly scales down and blurs for a depth effect.
    *   Live search with debouncing to prevent excessive API calls.
    *   Fluid, staggered "cascade" animation for incoming search results.
    *   A clean, modern grid layout with no poster distortion.

*   **"Awwwards-Level" Details Popup:**
    *   A large-format, full-screen modal with a banner layout.
    *   Uses the movie/show's backdrop as a dynamic, blurred banner.
    *   Content smoothly animates into view after the banner image is preloaded, ensuring a jank-free experience.
    *   Displays rich metadata: Poster, official title logo, year, MPAA rating, runtime, and genres.
    *   Horizontally scrolling cast list with actor photos.
    *   **Professional Seasons & Episodes Browser for TV Shows:**
        *   Interactive two-column layout with season tabs and a corresponding episode list.
        *   Features episode thumbnails, titles, and descriptions.
        *   Defaults to Season 1.

*   **"Watch Now" Functionality:**
    *   Integrated "Watch Now" buttons with links to a streaming source.
    *   Context-aware links for movies, TV shows (S01E01), and individual episodes.

*   **Responsive & Polished UI:**
    *   Fully responsive design that looks great on desktop, tablet, and mobile.
    *   Custom scrollbars and refined typography for a premium aesthetic.
    *   A polished loading state with a spinner provides immediate user feedback.

## Tech Stack & Architecture

This project was built with a focus on simplicity, performance, and modern development practices without relying on heavy frameworks or build tools.

*   **Frontend:**
    *   **HTML5:** Semantic and clean structure.
    *   **CSS3:** Advanced features including Grid, Flexbox, custom properties, transitions, and animations.
    *   **Vanilla JavaScript (ES6+):** All DOM manipulation, API fetching, and application logic are handled with modern, dependency-free JavaScript.

*   **Backend (Serverless):**
    *   **Netlify Functions:** A serverless Node.js environment is used to securely handle all API requests to TMDb, protecting the API key from being exposed on the client-side.

*   **API:**
    *   **The Movie Database (TMDb):** Used as the source for all movie, TV show, cast, and image data.

*   **Deployment:**
    *   **GitHub & Netlify:** The project is hosted on Netlify and continuously deployed from a GitHub repository, enabling instant updates on every `git push`.

## Project Structure

The file structure is organized for clarity and separation of concerns.

```
.
├── css/
│   └── style.css           # All styles for the application
├── js/
│   ├── main.js             # Core application logic, event listeners, UI rendering
│   └── tmdb.js             # Client-side functions to call Netlify serverless functions
├── netlify/
│   └── functions/
│       ├── get-media.js            # Fetches data for hero and carousels
│       ├── get-media-details.js    # Fetches rich, combined data for the details modal
│       └── search-media.js         # Handles search queries
└── index.html              # The main HTML entry point for the application
```

