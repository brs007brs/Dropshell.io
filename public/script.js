document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const filenameDisplay = document.getElementById('filename');
    const filesizeDisplay = document.getElementById('filesize');
    const removeFileBtn = document.getElementById('remove-file');
    const transferBtn = document.getElementById('transfer-btn');

    // Views
    const uploadView = document.getElementById('upload-view');
    const progressView = document.getElementById('progress-view');
    const successView = document.getElementById('success-view');
    const downloadView = document.getElementById('download-view');

    // Progress Elements
    const progressRing = document.getElementById('progress-ring');
    const progressPercent = document.getElementById('progress-percent');

    // Security Elements
    const securityOptions = document.getElementById('security-options');
    const uploadPassword = document.getElementById('upload-password');
    const uploadExpiration = document.getElementById('upload-expiration');

    // Download Security Elements
    const passwordPrompt = document.getElementById('password-prompt');
    const downloadDetails = document.getElementById('download-details');
    const downloadPassword = document.getElementById('download-password');
    const unlockBtn = document.getElementById('unlock-btn');
    const dlExpiration = document.getElementById('dl-expiration');
    const dlFilename = document.getElementById('dl-filename');
    const dlFilesize = document.getElementById('dl-filesize');
    const downloadBtn = document.getElementById('download-btn');

    // Success/Share Elements
    const shareLinkInput = document.getElementById('share-link');
    const copyBtn = document.getElementById('copy-btn');
    const uploadAnotherBtn = document.getElementById('upload-another');

    // State
    let selectedFile = null;
    let downloadToken = null;
    const CIRCLE_CIRCUMFERENCE = 440;

    // Check for download mode
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('file');

    if (fileId) {
        initDownloadMode(fileId);
    } else {
        initUploadMode();
    }

    // --- Upload Mode Logic ---

    function initUploadMode() {
        // Drag & Drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', handleDrop, false);
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);

        removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering dropZone click
            clearFile();
        });

        transferBtn.addEventListener('click', uploadFile);

        copyBtn.addEventListener('click', () => {
            shareLinkInput.select();
            document.execCommand('copy');
            copyBtn.textContent = 'COPIED';
            setTimeout(() => copyBtn.textContent = 'COPY LINK', 2000);
        });

        uploadAnotherBtn.addEventListener('click', () => {
            switchView(uploadView);
            clearFile();
        });
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            selectedFile = files[0];
            showFileInfo(selectedFile);
        }
    }

    function showFileInfo(file) {
        filenameDisplay.textContent = file.name;
        filesizeDisplay.textContent = formatBytes(file.size);

        dropZone.style.display = 'none';
        fileInfo.classList.remove('hidden');
        securityOptions.classList.remove('hidden'); // Show security options
        transferBtn.classList.remove('hidden');
    }

    function clearFile() {
        selectedFile = null;
        fileInput.value = '';
        uploadPassword.value = ''; // Clear password
        dropZone.style.display = 'block';
        fileInfo.classList.add('hidden');
        securityOptions.classList.add('hidden');
        transferBtn.classList.add('hidden');
    }

    function uploadFile() {
        if (!selectedFile) return;

        switchView(progressView);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('password', uploadPassword.value);
        formData.append('expiration', uploadExpiration.value);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                updateProgress(percentComplete);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                showSuccess(response);
            } else {
                alert('Upload failed');
                switchView(uploadView);
            }
        });

        xhr.addEventListener('error', () => {
            alert('Upload failed');
            switchView(uploadView);
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
    }

    function updateProgress(percent) {
        progressPercent.textContent = percent + '%';

        // ASCII Progress Bar
        const totalChars = 20;
        const filledChars = Math.round((percent / 100) * totalChars);
        const emptyChars = totalChars - filledChars;

        const bar = '[' + '='.repeat(filledChars) + (filledChars < totalChars ? '>' : '') + '.'.repeat(Math.max(0, emptyChars - 1)) + ']';

        const terminalProgress = document.getElementById('terminal-progress');
        if (terminalProgress) {
            terminalProgress.textContent = bar;
        }
    }

    function showSuccess(response) {
        setTimeout(() => {
            switchView(successView);
            shareLinkInput.value = response.downloadUrl;
        }, 500); // Small delay to show 100%
    }

    // --- Download Mode Logic ---

    function initDownloadMode(id) {
        switchView(downloadView);

        // Fetch file info
        fetch(`/api/info/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('File not found or expired');
                return res.json();
            })
            .then(data => {
                if (data.isProtected) {
                    showPasswordPrompt(id);
                } else {
                    // Hide password prompt and show download details
                    passwordPrompt.classList.add('hidden');
                    showDownloadDetails(id, data);
                }
            })
            .catch(err => {
                passwordPrompt.classList.add('hidden');
                downloadDetails.classList.remove('hidden');
                dlFilename.textContent = 'File not found or expired';
                dlFilesize.textContent = '';
                downloadBtn.disabled = true;
                downloadBtn.textContent = 'UNAVAILABLE';
            });
    }

    function showPasswordPrompt(id) {
        passwordPrompt.classList.remove('hidden');
        downloadDetails.classList.add('hidden');

        unlockBtn.addEventListener('click', () => {
            const password = downloadPassword.value;
            fetch(`/api/unlock/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })
                .then(res => {
                    if (!res.ok) throw new Error('Incorrect password');
                    return res.json();
                })
                .then(data => {
                    downloadToken = data.downloadToken;
                    passwordPrompt.classList.add('hidden');
                    showDownloadDetails(id, data);
                })
                .catch(err => {
                    alert('Access Denied: ' + err.message);
                });
        });
    }

    function showDownloadDetails(id, data) {
        downloadDetails.classList.remove('hidden');
        dlFilename.textContent = data.originalName;
        dlFilesize.textContent = formatBytes(data.size);

        if (data.expiresAt) {
            const date = new Date(data.expiresAt);
            dlExpiration.textContent = `> expires_at: ${date.toLocaleString()}`;
        }

        downloadBtn.addEventListener('click', () => {
            let url = `/api/download/${id}`;
            if (downloadToken) {
                url += `?token=${encodeURIComponent(downloadToken)}`;
            }
            window.location.href = url;
        });
    }

    // --- Utilities ---

    function switchView(view) {
        [uploadView, progressView, successView, downloadView].forEach(v => {
            v.classList.remove('active');
            // Small timeout to allow fade out if we were doing that, 
            // but for simplicity we just toggle display via class
            setTimeout(() => {
                if (v !== view) v.style.display = 'none';
            }, 0);
        });

        view.style.display = 'flex';
        // Force reflow
        void view.offsetWidth;
        view.classList.add('active');
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // --- Modal Logic ---
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalBody = document.getElementById('modal-body');
    const footerLinks = document.querySelectorAll('.footer-links a');

    // Modal Content Data
    const modalData = {
        terms: {
            title: 'TERMS_OF_SERVICE.txt',
            content: `
                <p>> INIT_SEQUENCE: LEGAL_PROTOCOL_V2.4</p>
                <p><strong>1. ACCEPTANCE OF PROTOCOLS</strong></p>
                <p>By accessing the Dropshell network nodes, you agree to be bound by these Terms of Service. If you do not agree, terminate your connection immediately.</p>
                
                <p><strong>2. DATA TRANSMISSION</strong></p>
                <p>Dropshell provides a transient data transfer tunnel. Files are stored temporarily on our secure nodes and are automatically purged after the set expiration time (1h, 24h, or 7d). We claim no ownership over your data packets.</p>
                
                <p><strong>3. PROHIBITED PAYLOADS</strong></p>
                <p>You agree not to upload malicious code, illegal contraband, or copyrighted material without authorization. Violators will be permanently banned from the subnet.</p>
                
                <p><strong>4. LIABILITY DISCLAIMER</strong></p>
                <p>The service is provided "AS IS". Dropshell is not liable for data loss, corruption, or interception by third-party actors. Use encryption for sensitive payloads.</p>
                
                <p>> END_OF_FILE</p>
            `
        },
        privacy: {
            title: 'PRIVACY_POLICY.enc',
            content: `
                <p>> DECRYPTING... SUCCESS.</p>
                <p><strong>1. ZERO-KNOWLEDGE ARCHITECTURE</strong></p>
                <p>We believe in absolute data sovereignty. We do not track your IP, browser fingerprint, or geolocation data. Your transfers are anonymous.</p>
                
                <p><strong>2. DATA RETENTION</strong></p>
                <p>Files are stored in volatile memory and temporary disk storage. Once a file expires, it is overwritten with random noise data to prevent recovery.</p>
                
                <p><strong>3. ENCRYPTION</strong></p>
                <p>All connections are secured via TLS 1.3. Password-protected files are hashed before storage. We cannot recover lost passwords.</p>
                
                <p><strong>4. THIRD-PARTY NODES</strong></p>
                <p>We do not sell, trade, or share your data with external corporations or government agencies unless compelled by a direct court order.</p>
                
                <p>> SESSION_TERMINATED</p>
            `
        },
        about: {
            title: 'ABOUT_DROPSHELL.readme',
            content: `
                <p>> LOADING_MANIFEST...</p>
                <p><strong>MISSION:</strong></p>
                <p>Dropshell is a modern file transfer platform designed for the contemporary web. We eliminate the bloat, ads, and tracking found in corporate alternatives.</p>
                
                <p><strong>ARCHITECTURE:</strong></p>
                <p>Built with modern web technologies and enterprise-grade security standards. We prioritize speed, reliability, and user privacy.</p>
                
                <p><strong>THE TEAM:</strong></p>
                <p>Developed by passionate engineers dedicated to preserving the open web and user privacy.</p>
                
                <p>> SYSTEM_STATUS: ONLINE</p>
            `
        },
        contact: {
            title: 'CONTACT_UPLINK.sh',
            content: `
                <p>> ESTABLISHING_UPLINK...</p>
                <p><strong>SUPPORT CHANNELS:</strong></p>
                <ul>
                    <li>> Email: <a href="#" style="color:var(--secondary)">support@dropshell.net</a></li>
                    <li>> Twitter: <a href="#" style="color:var(--secondary)">@dropshell_ops</a></li>
                    <li>> GitHub: <a href="#" style="color:var(--secondary)">/dropshell-core</a></li>
                </ul>
                
                <p><strong>BUG BOUNTY:</strong></p>
                <p>Found a vulnerability? Report it via encrypted channel PGP key: 0xDEADBEEF.</p>
                
                <p><strong>OFFICE:</strong></p>
                <p>Node 42, Server Farm 7<br>The Cloud, Sector 9</p>
                
                <p>> AWAITING_INPUT...</p>
            `
        }
    };

    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const type = link.getAttribute('data-modal');
            if (modalData[type]) {
                modalBody.innerHTML = `<h2>${modalData[type].title}</h2>` + modalData[type].content;
                openModal();
            }
        });
    });

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    function openModal() {
        modalOverlay.style.display = 'flex';
        // Force reflow
        void modalOverlay.offsetWidth;
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300);
    }
});
