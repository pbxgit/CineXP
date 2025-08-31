// A special diagnostic version of movie.js to find the exact failure point.

// Helper function to write log messages directly to the screen.
function logToScreen(message, isError = false) {
    const container = document.getElementById('movie-detail-container');
    if (container) {
        const p = document.createElement('p');
        p.textContent = message;
        if (isError) {
            p.style.color = '#FF6F91'; // Use our highlight color for errors
            p.style.fontWeight = 'bold';
        }
        container.appendChild(p);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // We will wrap the entire process in a try...catch to find any top-level errors.
    try {
        logToScreen("1. DOMContentLoaded event fired. Script is running.");
        
        const params = new URLSearchParams(window.location.search);
        const mediaId = params.get('id');
        const mediaType = params.get('media_type');

        if (mediaId && mediaType) {
            logToScreen(`2. Found mediaId: ${mediaId} and mediaType: ${mediaType}. Starting fetch.`);
            fetchMediaDetails(mediaId, mediaType);
        } else {
            logToScreen("CRITICAL ERROR: Could not find mediaId and mediaType in the URL.", true);
        }
    } catch (error) {
        logToScreen(`CRITICAL TOP-LEVEL ERROR: The script crashed during initial setup. Error: ${error.message}`, true);
    }
});


async function fetchMediaDetails(id, mediaType) {
    const container = document.getElementById('movie-detail-container');
    // Clear the spinner at the very beginning of the attempt.
    container.innerHTML = '';
    logToScreen("3. fetchMediaDetails function called. Spinner removed.");

    try {
        logToScreen("4. Calling fetch() for /api/tmdb...");
        const response = await fetch(`/api/tmdb?id=${id}&media_type=${mediaType}`);
        logToScreen(`5. fetch() completed. Response status: ${response.status}`);

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        logToScreen("6. Calling response.json()...");
        const media = await response.json();
        logToScreen("7. response.json() completed successfully. Data received.");

        if (!media || !media.id) {
            throw new Error("API returned invalid or empty data.");
        }
        
        logToScreen("8. Data is valid. Proceeding to render.");
        // We are not calling the full render function to keep this simple.
        logToScreen("SUCCESS! The script would now render the page.", false);
        const successMessage = document.createElement('h1');
        successMessage.textContent = `Successfully fetched: ${media.title || media.name}`;
        successMessage.style.color = '#00F5FF';
        container.appendChild(successMessage);

    } catch (error) {
        logToScreen(`CRITICAL ERROR during fetch process: ${error.message}`, true);
    }
}
