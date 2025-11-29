exports.handler = async function(event, context) {
    // --- THIS IS YOUR CONTROL PANEL ---
    // Edit this list to add/remove/reorder buttons.
    // The top item will be the default selected server.
    
    const serverList = [
        {
            name: "VidKing",
            // Crown Icon
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" clip-rule="evenodd" /></svg>`,
            movieUrlTemplate: "https://www.vidking.net/embed/movie/{id}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true",
            tvUrlTemplate: "https://www.vidking.net/embed/tv/{id}/{season}/{episode}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true"
        },
        {
            name: "CinemaOS",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 011.5 1.5v2.879a1.5 1.5 0 01-.379 1.06L9.439 12.12a1.5 1.5 0 01-2.121 0l-2.18-2.18a1.5 1.5 0 010-2.122L8.939 4.02a1.5 1.5 0 011.06-.521H10z"></path><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"></path></svg>`,
            movieUrlTemplate: "https://cinemaos.tech/player/{id}",
            tvUrlTemplate: "https://cinemaos.tech/player/{id}/{season}/{episode}"
        },
        {
            name: "Vidfast",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>`,
            movieUrlTemplate: "https://vidfast.pro/movie/{id}?theme=EF4444&autoPlay=true",
            tvUrlTemplate: "https://vidfast.pro/tv/{id}/{season}/{episode}?theme=EF4444&autoPlay=true"
        },
        {
            name: "Videasy",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"></path><path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>`,
            movieUrlTemplate: "https://vidsrc.to/embed/movie/{id}",
            tvUrlTemplate: "https://vidsrc.to/embed/tv/{id}/{season}/{episode}"
        }
    ];

    // --- END CONTROL PANEL ---

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600' // Cache this for 1 hour so it loads fast
        },
        body: JSON.stringify(serverList)
    };
};
