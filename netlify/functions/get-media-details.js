// In file: netlify/functions/get-media-details.js

exports.handler = async function(event, context) {
    const API_KEY = process.env.TMDB_API_KEY;
    const BASE_URL = 'https://api.themoviedb.org/3';
    const { type, id } = event.queryStringParameters;

    if (!type || !id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing type or id' }) };
    }

    // --- Efficiently Fetch Multiple Endpoints in Parallel ---
    // We need details, credits (cast), and release_dates (for MPAA rating)
    const endpoints = [
        `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US`,
        `${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}&language=en-US`,
    ];
    // For movies, we also fetch release dates to find the US rating. For TV, we fetch content ratings.
    if (type === 'movie') {
        endpoints.push(`${BASE_URL}/${type}/${id}/release_dates?api_key=${API_KEY}`);
    } else if (type === 'tv') {
        endpoints.push(`${BASE_URL}/${type}/${id}/content_ratings?api_key=${API_KEY}`);
    }


    try {
        const responses = await Promise.all(endpoints.map(url => fetch(url)));
        
        // Check if any of the API calls failed
        for (const response of responses) {
            if (!response.ok) {
                return { statusCode: response.status, body: await response.text() };
            }
        }
        
        const [details, credits, ratingsData] = await Promise.all(responses.map(res => res.json()));

        // --- Combine the data into a single, clean object ---
        const combinedData = {
            ...details,
            cast: credits.cast.slice(0, 6), // Get the top 6 cast members
        };

        // Find the US MPAA rating
        if (type === 'movie' && ratingsData.results) {
            const usRelease = ratingsData.results.find(r => r.iso_3166_1 === 'US');
            if (usRelease && usRelease.release_dates.length > 0) {
                // Find a non-empty certification
                const ratedRelease = usRelease.release_dates.find(rd => rd.certification);
                combinedData.certification = ratedRelease ? ratedRelease.certification : 'NR';
            }
        } else if (type === 'tv' && ratingsData.results) {
             const usRating = ratingsData.results.find(r => r.iso_3166_1 === 'US');
             combinedData.certification = usRating ? usRating.rating : 'N/A';
        }


        return {
            statusCode: 200,
            body: JSON.stringify(combinedData)
        };
    } catch (error) {
        return {
            statusCode: 502,
            body: JSON.stringify({ error: 'Failed to fetch combined media details.' })
        };
    }
};
