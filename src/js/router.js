// src/js/router.js
import { renderHomePage, renderSearchPage, renderDetailPage, renderWatchlistPage, updateNavLinks } from './ui.js';

const routes = {
    '/': renderHomePage,
    '/home': renderHomePage,
    '/search': renderSearchPage,
    '/watchlist': renderWatchlistPage
};

function router() {
    const hash = window.location.hash || '#/home';
    const [path, type, id] = hash.split('/'); // #/movie/123 -> ["", "movie", "123"]

    if (type && id && (type === 'movie' || type === 'tv')) {
        renderDetailPage(type, id);
    } else {
        const routeHandler = routes[path.replace('#', '')] || renderHomePage;
        routeHandler();
    }
    updateNavLinks(hash);
}

export function initializeRouter() {
    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);
}
