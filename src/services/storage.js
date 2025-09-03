// src/services/storage.js
const WATCHLIST_KEY = 'cinexp_watchlist';

/**
 * Retrieves the watchlist from localStorage.
 * @returns {Array<{id: string, type: string}>} - An array of watchlist item objects.
 */
export function getWatchlist() {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
}

/**
 * Saves the watchlist to localStorage.
 * @param {Array<{id: string, type: string}>} watchlist - The watchlist array to save.
 */
function saveWatchlist(watchlist) {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
}

/**
 * Adds a movie or TV show to the watchlist.
 * @param {string} type - 'movie' or 'tv'.
 * @param {string} id - The ID of the media.
 */
export function addToWatchlist(type, id) {
    const watchlist = getWatchlist();
    if (!isMovieInWatchlist(type, id)) {
        watchlist.push({ type, id });
        saveWatchlist(watchlist);
    }
}

/**
 * Removes a movie or TV show from the watchlist.
 * @param {string} type - 'movie' or 'tv'.
 * @param {string} id - The ID of the media.
 */
export function removeFromWatchlist(type, id) {
    let watchlist = getWatchlist();
    watchlist = watchlist.filter(item => !(item.id === id && item.type === type));
    saveWatchlist(watchlist);
}

/**
 * Checks if a specific item is already in the watchlist.
 * @param {string} type - 'movie' or 'tv'.
 * @param {string} id - The ID of the media.
 * @returns {boolean} - True if the item is in the watchlist.
 */
export function isMovieInWatchlist(type, id) {
    const watchlist = getWatchlist();
    return watchlist.some(item => item.id === id && item.type === type);
}
