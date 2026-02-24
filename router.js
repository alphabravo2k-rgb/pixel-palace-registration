// File: router.js

// 1. THE UNIVERSAL ROUTER
async function handleLocation() {
    // Grab the URL hash (e.g., "community-cup-2" from pixelpalace.gg/#/community-cup-2)
    let path = window.location.hash.replace('#/', '').toLowerCase();
    
    // Default to 'home' if there is no hash
    if (!path || path === '') path = 'home';

    // 2. AUTO-RESOLVE FILE PATH
    // If path is 'home', look in /pages/. Otherwise, look in /registrations/folder-name/
    let filePath = path === 'home' 
        ? './pages/home.html' 
        : `./registrations/${path}/content.html`;

    try {
        // Attempt to fetch the HTML file
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('File not found');
        
        // Inject the HTML into the shell
        const html = await response.text();
        document.getElementById('app').innerHTML = html;

        // Re-initialize UI Icons
        if (window.lucide) lucide.createIcons();

        // 3. AUTO-BIND THE REGISTRATION FORM
        const form = document.getElementById('registrationForm');
        if (form) {
            // Automatically convert folder name "community-cup-2" to DB ID "community_cup_2"
            const tournamentId = path.replace(/-/g, '_');
            setupUniversalForm(form, tournamentId);
        }

    } catch (error) {
        console.error("Router Error:", error);
        document.getElementById('app').innerHTML = `
            <div class="text-center py-32">
                <h1 class="text-6xl text-[var(--neon-pink)] brand-font mb-4">404</h1>
                <p class="text-zinc-400 tracking-widest uppercase data-font">Tournament route [ ${path} ] offline.</p>
            </div>`;
    }
}

// Listen for URL changes and page loads
window.addEventListener('hashchange', handleLocation);
window.addEventListener('DOMContentLoaded', handleLocation);
