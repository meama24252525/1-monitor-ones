// auto-refresh.js
(async () => {
    const vid = document.getElementById('vid');
    if (!vid) return;

    try { vid.play(); } catch {}
    setTimeout(() => {
        document.documentElement.requestFullscreen().catch(() => {});
    }, 1000);

    // Get video URL and map to GitHub API path
    const videoUrl = vid.querySelector('source').src;
    const repo = "meama24252525/1-monitor-ones";

    // Convert from Pages URL -> API path
    // Example: https://meama24252525.github.io/1-monitor-ones/2%20monitors/menu1/menu1.mp4
    // → https://api.github.com/repos/meama24252525/1-monitor-ones/contents/2 monitors/menu1/menu1.mp4
    const relativePath = decodeURIComponent(
        videoUrl.replace("https://meama24252525.github.io/1-monitor-ones/", "")
    );
    const githubApiUrl = `https://api.github.com/repos/${repo}/contents/${relativePath}`;

    console.log("🔍 Watching for changes:", githubApiUrl);

    let lastSha = null;

    async function checkForUpdates() {
        try {
            const res = await fetch(githubApiUrl + "?t=" + Date.now(), {
                headers: { "Accept": "application/vnd.github.v3+json" },
                cache: "no-cache"
            });

            if (!res.ok) {
                console.warn("GitHub API returned:", res.status);
                return;
            }

            const data = await res.json();
            const newSha = data.sha;

            if (lastSha && newSha !== lastSha) {
                console.log("♻️ Video changed — refreshing page...");
                location.reload(true);
            }

            lastSha = newSha;
        } catch (err) {
            console.error("Update check failed:", err);
        }
    }

    setInterval(checkForUpdates, 10000); // check every 10 seconds
    checkForUpdates();
})();
