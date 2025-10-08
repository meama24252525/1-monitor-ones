// auto-refresh.js (debug version)
(async () => {
    const vid = document.getElementById('vid');
    if (!vid) {
        console.warn('No video element found.');
        return;
    }

    try { vid.play(); } catch {}
    setTimeout(() => {
        document.documentElement.requestFullscreen().catch(() => {});
    }, 1000);

    const videoUrl = vid.querySelector('source').src;
    const apiPath = videoUrl
        .replace('https://meama24252525.github.io/', '')
        .replace(/^1-monitor-ones\//, '')
        .replace(/%20/g, ' ');
    const githubApiUrl = `https://api.github.com/repos/meama24252525/1-monitor-ones/contents/${apiPath}`;

    console.log('Checking for updates on:', githubApiUrl);
    let lastSha = null;

    async function checkForUpdates() {
        try {
            const response = await fetch(githubApiUrl + '?t=' + Date.now(), {
                cache: 'no-cache',
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });
            console.log('GitHub response status:', response.status);
            if (!response.ok) return;

            const data = await response.json();
            console.log('Current SHA:', data.sha);

            if (lastSha && data.sha !== lastSha) {
                console.log('Video updated on GitHub — refreshing page...');
                location.reload(true);
            }
            lastSha = data.sha;
        } catch (err) {
            console.error('Update check failed:', err);
        }
    }

    setInterval(checkForUpdates, 10000);
    checkForUpdates();
})();
