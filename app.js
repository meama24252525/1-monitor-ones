import { CONFIG } from './config.js';
import { loadMenusFromFolder, getCurrentFileInfo, replaceFile, deleteFile, fileToBase64 } from './github-api.js';
import { VideoPlayer } from './video-player.js';

class MenuManager {
    constructor() {
        this.menus = {
            single: [],
            dual: [],
            vertical: []
        };
        this.selectedFile = null;
        this.videoPlayer = new VideoPlayer();
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadAllMenus();
    }

    attachEventListeners() {
        document.getElementById('uploadBtn').addEventListener('click', () => this.triggerFileUpload());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadAllMenus());
        document.getElementById('closeVideoBtn').addEventListener('click', () => this.videoPlayer.close());
        document.getElementById('confirmReplaceBtn').addEventListener('click', () => this.startReplacement());
        document.getElementById('cancelUploadBtn').addEventListener('click', () => this.closeUploadModal());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.videoPlayer.close();
                this.closeUploadModal();
            }
        });
    }

    async loadAllMenus() {
        this.clearSelection();
        document.getElementById('status').textContent = 'Loading menus...';
        document.getElementById('content').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            this.menus.single = await loadMenusFromFolder(CONFIG.folders.single);
            
            const dualMenus = await Promise.all(
                CONFIG.folders.dual.map(folder => loadMenusFromFolder(folder))
            );
            this.menus.dual = dualMenus.flat();
            
            const verticalMenus = await Promise.all(
                CONFIG.folders.vertical.map(folder => loadMenusFromFolder(folder))
            );
            this.menus.vertical = verticalMenus.flat();
            
            this.displayMenus();
            
            const total = this.menus.single.length + this.menus.dual.length + this.menus.vertical.length;
            document.getElementById('status').textContent = `Found ${total} menu files`;
            
        } catch (error) {
            document.getElementById('content').innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }

    displayMenus() {
        let html = '';
        
        if (this.menus.single.length > 0) {
            html += this.createSection('Single Monitor', this.menus.single, 'single');
        }
        
        if (this.menus.dual.length > 0) {
            html += this.createSection('Dual Monitor', this.menus.dual, 'dual');
        }
        
        if (this.menus.vertical.length > 0) {
            html += this.createSection('Vertical Monitor', this.menus.vertical, 'vertical');
        }
        
        document.getElementById('content').innerHTML = html || '<div class="loading">No menus found</div>';
    }

    createSection(title, menus, type) {
        return `
            <div class="folder-section">
                <h2>${title} (${menus.length})</h2>
                <div class="grid">
                    ${menus.map(menu => this.createMenuCard(menu, type)).join('')}
                </div>
            </div>
        `;
    }

    createMenuCard(menu, type) {
        return `
            <div class="menu-card ${type}" id="card-${menu.path}" onclick="menuManager.selectFile('${menu.path}', '${menu.name}', '${type}')">
                <div class="video-thumbnail">
                    <video preload="metadata" muted>
                        <source src="${menu.download_url}#t=1" type="video/mp4">
                    </video>
                </div>
                <div class="video-content">
                    <div class="menu-name">${menu.name}</div>
                    <div class="menu-info">${(menu.size / (1024*1024)).toFixed(1)} MB</div>
                </div>
            </div>
        `;
    }

    selectFile(filePath, fileName, folder) {
        // Automatically unselect previous selection
        document.querySelectorAll('.menu-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const cardElement = document.getElementById(`card-${filePath}`);
        if (cardElement) {
            cardElement.classList.add('selected');
        }
        
        this.selectedFile = { path: filePath, name: fileName, folder: folder };
        
        document.getElementById('selectedFileName').textContent = `Selected: ${fileName}`;
        document.getElementById('selectionInfo').style.display = 'block';
        document.getElementById('uploadBtn').disabled = false;
    }

    clearSelection() {
        document.querySelectorAll('.menu-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.selectedFile = null;
        document.getElementById('selectionInfo').style.display = 'none';
        document.getElementById('uploadBtn').disabled = true;
    }

    triggerFileUpload() {
        if (!this.selectedFile) {
            alert('Please select a file to replace first');
            return;
        }
        document.getElementById('fileInput').click();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file || !this.selectedFile) return;
        
        if (file.size > CONFIG.maxFileSize) {
            alert(`File too large (${(file.size / (1024*1024)).toFixed(1)} MB). Max is 10MB.`);
            return;
        }
        
        document.getElementById('replaceInfo').innerHTML = `
            <p><strong>Replacing:</strong> ${this.selectedFile.name}</p>
            <p><strong>With:</strong> ${file.name}</p>
        `;
        
        this.newFile = file;
        document.getElementById('uploadOverlay').classList.add('show');
    }

    closeUploadModal() {
        document.getElementById('uploadOverlay').classList.remove('show');
        document.getElementById('fileInput').value = '';
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadButtons').style.display = 'block';
    }

    async startReplacement() {
        if (!this.newFile || !this.selectedFile) return;
        
        document.getElementById('uploadProgress').style.display = 'block';
        document.getElementById('uploadButtons').style.display = 'none';
        
        try {
            const progressBar = document.getElementById('progressFill');
            progressBar.style.width = '33%';
            
            const base64 = await fileToBase64(this.newFile);
            progressBar.style.width = '66%';
            
            const fileInfo = await getCurrentFileInfo(this.selectedFile.path);
            await replaceFile(this.selectedFile.path, base64, this.newFile.name, fileInfo.sha);
            
            progressBar.style.width = '100%';
            document.getElementById('uploadStatus').textContent = 'Success!';
            
            setTimeout(() => {
                this.closeUploadModal();
                this.loadAllMenus();
            }, 1500);
            
        } catch (error) {
            alert('Upload failed: ' + error.message);
            this.closeUploadModal();
        }
    }
}

// Initialize the app
const menuManager = new MenuManager();
window.menuManager = menuManager;