
/**
 * File Browser Module
 * Provides functionality to browse files on the server.
 */

class FileBrowser {
    constructor() {
        this.currentPath = '.';
        this.selectedFile = null;
        this.onSelectCallback = null;
        this.onCancelCallback = null;
        this.isOpen = false;
        this.overlay = null;
    }

    /**
     * Initialize the file browser DOM elements
     */
    init() {
        if (this.overlay) return; // Already initialized

        // Create Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'file-browser-overlay';
        this.overlay.style.display = 'none';

        // Create Window
        const windowDiv = document.createElement('div');
        windowDiv.className = 'file-browser-window';

        // Header
        const header = document.createElement('div');
        header.className = 'file-browser-header';

        this.title = document.createElement('div');
        this.title.className = 'file-browser-title';
        this.title.textContent = 'Open File';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'file-browser-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.close();

        header.appendChild(this.title);
        header.appendChild(closeBtn);

        // Path Bar
        const pathBar = document.createElement('div');
        pathBar.className = 'file-browser-path-bar';

        const pathLabel = document.createElement('span');
        pathLabel.textContent = 'Path:';

        this.pathDisplay = document.createElement('span');
        this.pathDisplay.className = 'file-browser-current-path';
        this.pathDisplay.textContent = '';

        pathBar.appendChild(pathLabel);
        pathBar.appendChild(this.pathDisplay);

        // File List
        this.fileListContainer = document.createElement('div');
        this.fileListContainer.className = 'file-browser-list';

        // Filename Input (for save mode)
        this.filenameInputContainer = document.createElement('div');
        this.filenameInputContainer.className = 'file-browser-filename-container';
        this.filenameInputContainer.style.display = 'none';

        const filenameLabel = document.createElement('span');
        filenameLabel.textContent = 'Filename:';
        filenameLabel.style.marginRight = '10px';
        filenameLabel.style.color = '#ccc';

        this.filenameInput = document.createElement('input');
        this.filenameInput.type = 'text';
        this.filenameInput.className = 'file-browser-filename-input';

        this.filenameInput.addEventListener('input', () => {
            if (this.mode === 'save') {
                this.selectBtn.disabled = this.filenameInput.value.trim() === '';
            }
        });

        this.filenameInputContainer.appendChild(filenameLabel);
        this.filenameInputContainer.appendChild(this.filenameInput);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'file-browser-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'file-browser-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => this.close();

        this.selectBtn = document.createElement('button');
        this.selectBtn.className = 'file-browser-btn primary';
        this.selectBtn.textContent = 'Select';
        this.selectBtn.disabled = true;
        this.selectBtn.onclick = () => this.handleSelection();

        footer.appendChild(cancelBtn);
        footer.appendChild(this.selectBtn);

        // Assemble
        windowDiv.appendChild(header);
        windowDiv.appendChild(pathBar);
        windowDiv.appendChild(this.fileListContainer);
        windowDiv.appendChild(this.filenameInputContainer);
        windowDiv.appendChild(footer);
        this.overlay.appendChild(windowDiv);

        document.body.appendChild(this.overlay);
    }

    /**
     * Open the file browser
     * @param {Function} onSelect - Callback when a file is selected (returns filepath)
     * @param {string} startPath - Optional starting path
     * @param {string} fileType - Optional file extension filter (e.g. ".json") or "all"
     */
    open(onSelect, startPath = '.', fileType = 'all', mode = 'open') {
        this.init();
        this.onSelectCallback = onSelect;
        this.currentPath = startPath;
        this.fileType = fileType;
        this.mode = mode;
        this.isOpen = true;
        this.overlay.style.display = 'flex';
        this.selectedFile = null;
        this.selectBtn.disabled = true;

        if (this.mode === 'save') {
            this.title.textContent = 'Save File';
            this.selectBtn.textContent = 'Save';
            this.filenameInputContainer.style.display = 'flex';
            this.filenameInput.value = '';
        } else {
            this.title.textContent = 'Open File';
            this.selectBtn.textContent = 'Select';
            this.filenameInputContainer.style.display = 'none';
        }

        this.fetchFiles();
    }

    close() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
        this.isOpen = false;
        if (this.onCancelCallback) {
            this.onCancelCallback();
        }
    }

    async fetchFiles() {
        try {
            this.fileListContainer.innerHTML = '<div style="padding:10px; color:#aaa;">Loading...</div>';

            const response = await fetch('/fileBrowser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startDirectory: this.currentPath,
                    filetype: this.fileType
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.render(data);

        } catch (e) {
            console.error("File Browser Error:", e);
            this.fileListContainer.innerHTML = `<div style="padding:10px; color:red;">Error: ${e.message}</div>`;
        }
    }

    render(data) {
        this.currentPath = data.currentDirectory;
        this.pathDisplay.textContent = this.currentPath;
        this.fileListContainer.innerHTML = '';

        // Directories
        if (data.directories) {
            data.directories.forEach(dir => {
                // Skip '.' but keep '..'
                const dirName = dir.split(/[\\/]/).pop() || dir;
                if (dirName === '.') return;

                const item = this.createItem(dirName, dir, true);
                this.fileListContainer.appendChild(item);
            });
        }

        // Files
        if (data.files) {
            data.files.forEach(file => {
                const fileName = file.split(/[\\/]/).pop() || file;
                const item = this.createItem(fileName, file, false);
                this.fileListContainer.appendChild(item);
            });
        }
    }

    createItem(name, fullPath, isDirectory) {
        const item = document.createElement('div');
        item.className = 'file-browser-item';

        const icon = document.createElement('span');
        icon.className = `file-browser-icon ${isDirectory ? 'folder' : 'file'}`;
        icon.innerHTML = isDirectory ? '&#128193;' : '&#128462;'; // Folder and File unicode icons

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-browser-name';
        nameSpan.textContent = name;

        item.appendChild(icon);
        item.appendChild(nameSpan);

        item.onclick = () => {
            if (isDirectory) {
                this.currentPath = fullPath;
                this.fetchFiles();
            } else {
                // Select file
                this.selectFile(fullPath, item);
            }
        };

        // Double click to select immediately
        item.ondblclick = () => {
            if (!isDirectory) {
                this.selectFile(fullPath, item);
                this.handleSelection();
            }
        };

        return item;
    }

    selectFile(path, element) {
        // Deselect others
        const selected = this.fileListContainer.querySelectorAll('.selected');
        selected.forEach(el => el.classList.remove('selected'));

        element.classList.add('selected');
        this.selectedFile = path;
        this.selectBtn.disabled = false;

        if (this.mode === 'save') {
            const filename = path.split(/[\\/]/).pop();
            this.filenameInput.value = filename;
        }
    }

    handleSelection() {
        if (this.mode === 'save') {
            const filename = this.filenameInput.value.trim();
            if (filename) {
                // Construct full path
                let separator = '/';
                if (this.currentPath.includes('\\')) separator = '\\';
                const fullPath = this.currentPath + (this.currentPath.endsWith(separator) ? '' : separator) + filename;

                if (this.onSelectCallback) {
                    this.onSelectCallback(fullPath);
                    this.close();
                }
            }
        } else {
            if (this.selectedFile && this.onSelectCallback) {
                this.onSelectCallback(this.selectedFile);
                this.close();
            }
        }
    }
}

// Singleton instance
const fileBrowser = new FileBrowser();
