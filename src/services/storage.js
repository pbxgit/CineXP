// src/services/storage.js
const WATCHLIST_KEY = 'cinexp_watchlist';

// Get watchlist from localStorage
export function getWatchlist() {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
}

// Save an item to the watchlist
export function addToWatchlist(movieId) {
    const watchlist = getWatchlist();
    if (!watchlist.includes(movieId)) {
        watchlist.push(movieId);
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    }
}

// Remove an item from the watchlist
export function removeFromWatchlist(movieId) {
    let watchlist = getWatchlist();
    watchlist = watchlist.filter(id => id !== movieId);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
}
