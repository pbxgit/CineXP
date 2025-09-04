// In file: netlify/functions/get-media-details.js

exports.handler = async function(event, context) {
    const API_KEY = process.env.TMDB_API_KEY;
    const BASE_URL = 'https://api.themoviedb.org/3';
    const { type, id } = event.queryStringParameters;

    if (!type || !id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing type or id' }) };
    }

    try {
        // --- Step 1: Fetch the main details and credits ---
        const detailsUrl = `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US`;
        const creditsUrl = `${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}&language=en-US`;

        const [detailsRes, creditsRes] = await Promise.all([fetch(detailsUrl), fetch(creditsUrl)]);

        if (!detailsRes.ok) return { statusCode: detailsRes.status, body: await detailsRes.text() };
        if (!creditsRes.ok) return { statusCode: creditsRes.status, body: await creditsRes.text() };

        const details = await detailsRes.json();
        const credits = await creditsRes.json();

        // --- Step 2: Combine initial data ---
        const combinedData = {
            ...details,
            cast: credits.cast.slice(0, 6), // Top 6 cast members
        };

        // --- Step 3: Fetch supplemental data (ratings and seasons) ---
        if (type === 'movie') {
            const ratingsUrl = `${BASE_URL}/movie/${id}/release_dates?api_key=${API_KEY}`;
            const ratingsRes = await fetch(ratingsUrl);
            if (ratingsRes.ok) {
                const ratingsData = await ratingsRes.json();
                const usRelease = ratingsData.results.find(r => r.iso_3166_1 === 'US');
                if (usRelease?.release_dates.length > 0) {
                    const rated = usRelease.release_dates.find(rd => rd.certification);
                    combinedData.certification = rated ? rated.certification : 'NR';
                }
            }
        } else if (type === 'tv') {
            const ratingsUrl = `${BASE_URL}/tv/${id}/content_ratings?api_key=${API_KEY}`;
            const ratingsRes = await fetch(ratingsUrl);
            if (ratingsRes.ok) {
                const ratingsData = await ratingsRes.json();
                const usRating = ratingsData.results.find(r => r.iso_3166_1 === 'US');
                combinedData.certification = usRating ? usRating.rating : 'N/A';
            }
            
            // **NEW: Fetch all season details in parallel for TV shows**
            if (details.seasons && details.seasons.length > 0) {
                const seasonPromises = details.seasons
                    // Filter out "Specials" seasons which often lack good data
                    .filter(season => season.season_number > 0)
                    .map(season => {
                        const seasonUrl = `${BASE_URL}/tv/${id}/season/${season.season_number}?api_key=${API_KEY}&language=en-US`;
                        return fetch(seasonUrl).then(res => res.json());
                    });
                
                const seasonsDetails = await Promise.all(seasonPromises);
                // Attach the detailed season info (with episode counts) to our main object
                combinedData.seasons = seasonsDetails;
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(combinedData)
        };
    } catch (error) {
        console.error('Error fetching combined media details:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error.' })
        };
    }
};
