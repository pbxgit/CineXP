// header-loader.js - A dedicated script to load the global header

document.addEventListener('DOMContentLoaded', () => {
    fetch('/header.html') // Fetch from the root
        .then(response => {
            if (!response.ok) {
                throw new Error('Header component not found');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('global-header').innerHTML = data;
            
            // Manually trigger the logic from global.js now that the header exists
            initializeGlobalNav();
        })
        .catch(error => {
            console.error('Failed to load global header:', error);
            // Optionally display an error to the user in the header area
            document.getElementById('global-header').innerHTML = '<p class="error-message">Could not load navigation.</p>';
        });
});
