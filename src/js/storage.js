// src/js/storage.js
const WATCHLIST_KEY = 'cinexp_watchlist_v2';

export function getWatchlist() {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
}

function saveWatchlist(watchlist) {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
}

export function addToWatchlist(type, id) {
    const watchlist = getWatchlist();
    if (!isInWatchlist(type, id)) {
        watchlist.push({ type, id: parseInt(id) });
        saveWatchlist(watchlist);
    }
}

export function removeFromWatchlist(type, id) {
    let watchlist = getWatchlist();
    watchlist = watchlist.filter(item => !(item.type === type && item.id === parseInt(id)));
    saveWatchlist(watchlist);
}

export function isInWatchlist(type, id) {
    return getWatchlist().some(item => item.type === type && item.id === parseInt(id));
}
