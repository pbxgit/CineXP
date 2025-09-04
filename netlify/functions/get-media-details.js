// In file: netlify/functions/get-media-details.js

exports.handler = async function(event, context) {
    const API_KEY = process.env.TMDB_API_KEY;
    const BASE_URL = 'https://api.themoviedb.org/3';
    const { type, id } = event.queryStringParameters;

    if (!type || !id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing type or id' }) };
    }

    try {
        // --- Step 1: Fetch the main details, credits, and images (for logos) in parallel ---
        const detailsUrl = `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US`;
        const creditsUrl = `${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}&language=en-US`;
        const imagesUrl = `${BASE_URL}/${type}/${id}/images?api_key=${API_KEY}`; // No language needed

        const [detailsRes, creditsRes, imagesRes] = await Promise.all([
            fetch(detailsUrl),
            fetch(creditsUrl),
            fetch(imagesUrl)
        ]);

        if (!detailsRes.ok) return { statusCode: detailsRes.status, body: await detailsRes.text() };
        if (!creditsRes.ok) return { statusCode: creditsRes.status, body: await creditsRes.text() };
        if (!imagesRes.ok) return { statusCode: imagesRes.status, body: await imagesRes.text() };

        const details = await detailsRes.json();
        const credits = await creditsRes.json();
        const images = await imagesRes.json();

        // --- Step 2: Combine initial data ---
        const combinedData = {
            ...details,
            cast: credits.cast.slice(0, 10), // Get top 10 cast
            logos: images.logos || [], // Attach all logos
        };

        // --- Step 3: Fetch supplemental data (ratings and full season/episode data) ---
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
                combinedData.certification = usRating ? usRating.rating : 'TV-NR';
            }
            
            // **UPGRADE: Fetch all season details WITH episodes in parallel**
            if (details.seasons && details.seasons.length > 0) {
                const seasonPromises = details.seasons
                    .filter(season => season.season_number > 0) // Exclude "Specials"
                    .map(season => {
                        // The `append_to_response` parameter is not available for season details.
                        // We fetch the season details which includes the episode list.
                        const seasonUrl = `${BASE_URL}/tv/${id}/season/${season.season_number}?api_key=${API_KEY}&language=en-US`;
                        return fetch(seasonUrl).then(res => res.json());
                    });
                
                const seasonsDetails = await Promise.all(seasonPromises);
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
