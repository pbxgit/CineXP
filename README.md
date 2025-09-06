# Cine Explorer

A state-of-the-art, AI-powered movie and TV show discovery web application built with a modern, serverless architecture. This project features a fully integrated, high-performance video player and an intelligent, dual-mode search engine.

This entire application was developed on Android devices, showcasing a pure HTML, CSS, and Vanilla JavaScript workflow without relying on a traditional desktop development environment or build tools.

**Live Demo:** [**pbmovie.netlify.app**](https://pbmovie.netlify.app/)

*(Note: For the best experience, please view the live demo on a desktop browser.)*

## Core Features

Cine Explorer is designed to provide a seamless, fluid, and visually stunning user experience, rivaling top-tier streaming services with unique, interactive flourishes.

*   ### Cinematic Hero Section
    *   Features the top 7 trending movies and TV shows for immediate discovery.
    *   A slow, captivating **Ken Burns effect** on backdrop images, enhanced with a subtle mouse-based parallax effect for a sense of depth.
    *   Displays the official title logo with a clean, animated fallback to a stylized text title.
    *   Dynamic tagline and an interactive, auto-playing progress bar for intuitive slide navigation.

*   ### "Spotlight" Search Experience
    *   An immersive full-screen overlay with a refined, minimalist aesthetic.
    *   The background page smoothly scales down and blurs for a beautiful depth effect.
    *   A large, uppercase input field (`WHAT'S ON YOUR MIND?`) provides a clear and stylish call to action.
    *   Results are presented in a clean, expansive list with a subtle **"spotlight" hover effect** that follows the cursor, making the UI feel alive and responsive.

*   ### Hybrid AI Search Functionality
    *   **Live Direct Search:** As you type, the app performs a lightning-fast, direct search against the TMDb API, showing you the most relevant titles instantly.
    *   **AI-Powered Discovery:** Pressing **`Enter`** triggers a powerful AI search. The app sends your natural language query (e.g., *"A mind-bending sci-fi blockbuster from the 90s"*) to the Google Gemini API, which intelligently translates it into precise search parameters to discover hidden gems.

*   ### Fully Integrated Cinematic Player
    *   **Seamless Integration:** Replaces all external links with a built-in, full-screen player overlay powered by Videasy.
    *   **High Performance:** The player is heavily optimized. When it opens, all background animations (like the Ken Burns effect) are paused, and the main page content is hidden, dedicating 100% of browser resources to ensuring **smooth, lag-free video playback**.
    *   **Custom Theming:** The player's internal controls are themed with a custom red accent color (`#EF4444`) to match a modern aesthetic.
    *   **Feature-Rich:** Includes support for autoplay, overlays, episode selectors, and automatic playback of the next episode for TV shows.

*   ### "Awwwards-Level" Details Popup
    *   A large-format, full-screen modal with a dynamic, blurred banner generated from the movie/show's backdrop.
    *   Content smoothly animates into view, ensuring a jank-free experience.
    *   Displays rich metadata: Poster, official title logo, year, MPAA rating, runtime, and genres.
    *   Features a horizontally scrolling cast list and a professional, two-column Seasons & Episodes browser for TV shows.

## Tech Stack & Architecture

This project was built with a focus on simplicity, performance, and modern development practices without relying on heavy frameworks or build tools.

*   **Frontend:**
    *   **HTML5:** Semantic and clean structure.
    *   **CSS3:** Advanced features including Grid, Flexbox, custom properties, transitions, and sophisticated animations.
    *   **Vanilla JavaScript (ES6+):** All DOM manipulation, API fetching, and application logic are handled with modern, dependency-free JavaScript.

*   **Backend (Serverless):**
    *   **Netlify Functions:** A serverless Node.js environment is used to securely handle all API requests, protecting sensitive API keys from being exposed on the client-side.

*   **APIs & Services:**
    *   **The Movie Database (TMDb):** The primary source for all movie, TV show, cast, and image data.
    *   **Google Gemini:** Powers the AI Vibe Check and the intelligent AI Discovery search feature.
    *   **Videasy:** Provides the robust, embeddable player for all video content.

*   **Deployment:**
    *   **GitHub & Netlify:** The project is hosted on Netlify and continuously deployed from a GitHub repository, enabling instant updates on every `git push`.

## Project Structure

The file structure is organized for clarity and separation of concerns, with dedicated serverless functions for each API task.

```
.
├── css/
│   └── style.css           # All styles for the application
├── js/
│   ├── main.js             # Core application logic, event listeners, UI rendering
│   └── tmdb.js             # Client-side functions to call Netlify functions
├── netlify/
│   └── functions/
│       ├── discover-media.js       # [NEW] Handles complex discovery queries from the AI
│       ├── get-ai-search-query.js  # [NEW] Translates natural language to a TMDb query
│       ├── get-ai-vibe.js          # Fetches "Vibe Check" and "Smart Tags" from Gemini
│       ├── get-media.js            # Fetches data for hero and carousels
│       ├── get-media-details.js    # Fetches rich, combined data for the details modal
│       └── search-media.js         # Handles fast, direct search queries
└── index.html              # The main HTML entry point for the application
```

