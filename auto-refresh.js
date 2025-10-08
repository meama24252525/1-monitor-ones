// auto-refresh.js
(async () => {
    const vid = document.getElementById('vid');
    if (!vid) return;

    try { vid.play(); } catch {}
    setTimeout(() => {
        document.documentElement.requestFullscreen().catch(() => {});
    }, 1000);

    // === CONFIG ===
    const githubFile = vid.querySelector('source').src
        .replace('https://meama24252525.github.io/', 'https://api.github.com/repos/meama24252525/1-monitor-ones/contents/');
    let lastSha = null;

    // === CHECK FUNCTION ===
    async function checkForUpdates() {
        try {
            const response = await fetch(githubFile + '?t=' + Date.now(), {
                cache: 'no-cache',
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });
            if (!response.ok) throw new Error('GitHub API error ' + response.status);
            const data = await response.json();
            const currentSha = data.sha;

            if (lastSha && currentSha !== lastSha) {
                console.log('Video updated on GitHub, refreshing...');
                location.reload(true);
            }
            lastSha = currentSha;
        } catch (err) {
            console.warn('Update check failed:', err);
        }
    }

    setInterval(checkForUpdates, 10000);
    checkForUpdates();
})();
