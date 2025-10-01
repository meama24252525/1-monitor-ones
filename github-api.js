import { CONFIG } from './config.js';

// ADD YOUR GITHUB TOKEN HERE
const GITHUB_TOKEN = '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'; // Replace with your actual token

export async function loadMenusFromFolder(folderName) {
    try {
        const url = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repoName}/contents/${encodeURIComponent(folderName)}`;
        const response = await fetch(url);
        
        if (!response.ok) return [];
        
        const contents = await response.json();
        
        return contents
            .filter(item => item.type === 'file' && item.name.toLowerCase().endsWith('.mp4'))
            .map(item => ({
                name: item.name,
                path: item.path,
                download_url: item.download_url,
                size: item.size,
                sha: item.sha
            }));
            
    } catch (error) {
        console.error('Error loading folder:', error);
        return [];
    }
}

export async function getCurrentFileInfo(filePath) {
    const url = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repoName}/contents/${filePath}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`Could not get file info: ${response.status}`);
    }
    
    return await response.json();
}

export async function replaceFile(filePath, base64Content, fileName, currentSha) {
    const url = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repoName}/contents/${filePath}`;
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'Authorization': `token ${GITHUB_TOKEN}`
        },
        body: JSON.stringify({
            message: `Replace ${filePath.split('/').pop()} with ${fileName}`,
            content: base64Content,
            sha: currentSha
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Upload failed: ${response.status}`);
    }
}

export async function deleteFile(filePath, fileSha, fileName) {
    const url = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repoName}/contents/${filePath}`;
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'Authorization': `token ${GITHUB_TOKEN}`
        },
        body: JSON.stringify({
            message: `Delete ${fileName}`,
            sha: fileSha
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Delete failed: ${response.status}`);
    }
}

export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });

}
