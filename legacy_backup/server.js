const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Use original name but we'll track it by ID in memory or just use ID for retrieval
        // For simplicity in this no-db version, we'll prefix with UUID to avoid collisions
        // or better, store in a folder named with the UUID.
        // Let's use a simple map for metadata since we don't have a DB.
        const fileId = uuidv4();
        file.fileId = fileId; // Attach to file object to access later
        cb(null, fileId + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 * 1024 } // 20GB limit
});

// In-memory metadata store (Note: will reset on server restart)
const fileMetadata = new Map();

app.use(express.json());

// Serve static files but intercept root for SEO
app.use(express.static('public', { index: false }));

// SEO-Optimized Root Route
app.get('/', (req, res) => {
    const fileId = req.query.file;
    const filePath = path.join(__dirname, 'public', 'index.html');

    fs.readFile(filePath, 'utf8', (err, htmlData) => {
        if (err) {
            return res.status(500).send('Error loading page');
        }

        if (fileId && fileMetadata.has(fileId)) {
            const meta = fileMetadata.get(fileId);

            // Inject Dynamic SEO Tags
            htmlData = htmlData
                .replace('<title>Dropshell | Secure File Sharing</title>', `<title>Download ${meta.originalName} | Dropshell</title>`)
                .replace('content="Dropshell - Secure File Transfer"', `content="Download ${meta.originalName} (${formatBytes(meta.size)}) securely via Dropshell."`)
                .replace('content="Dropshell"', `content="Download ${meta.originalName}"`);

            // Add OG Tags if missing (simple injection)
            const ogTags = `
                <meta property="og:title" content="Download ${meta.originalName} | Dropshell" />
                <meta property="og:description" content="Securely transfer files with Dropshell. No login required." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            `;
            htmlData = htmlData.replace('</head>', `${ogTags}</head>`);
        } else {
            // Default SEO
            const ogTags = `
                <meta property="og:title" content="Dropshell | Secure File Sharing" />
                <meta property="og:description" content="Anonymous, secure, and fast file transfer. Up to 20GB free." />
                <meta property="og:type" content="website" />
            `;
            htmlData = htmlData.replace('</head>', `${ogTags}</head>`);
        }

        res.send(htmlData);
    });
});

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = req.file.fileId;
    const filename = req.file.filename;
    const password = req.body.password || null;
    const expirationHours = parseInt(req.body.expiration) || 24; // Default 24h

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + expirationHours);

    // Store metadata
    fileMetadata.set(fileId, {
        originalName: req.file.originalname,
        filename: filename,
        size: req.file.size,
        uploadDate: new Date(),
        expiresAt: expirationDate,
        password: password
    });

    // Return the download link/ID
    res.json({
        success: true,
        fileId: fileId,
        downloadUrl: `${req.protocol}://${req.get('host')}/?file=${fileId}`
    });
});

// File Info Endpoint
app.get('/api/info/:id', (req, res) => {
    const fileId = req.params.id;
    if (!fileMetadata.has(fileId)) {
        return res.status(404).json({ error: 'File not found or expired' });
    }

    const meta = fileMetadata.get(fileId);

    // Check expiration
    if (new Date() > meta.expiresAt) {
        // Delete file (in a real app, we'd delete from disk too)
        fileMetadata.delete(fileId);
        // fs.unlink...
        return res.status(404).json({ error: 'File expired' });
    }

    // Check protection
    if (meta.password) {
        return res.json({
            isProtected: true,
            fileId: fileId
        });
    }

    res.json({
        isProtected: false,
        originalName: meta.originalName,
        size: meta.size,
        expiresAt: meta.expiresAt
    });
});

// Unlock Endpoint
app.post('/api/unlock/:id', (req, res) => {
    const fileId = req.params.id;
    const { password } = req.body;

    if (!fileMetadata.has(fileId)) {
        return res.status(404).json({ error: 'File not found' });
    }

    const meta = fileMetadata.get(fileId);

    if (meta.password && meta.password !== password) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json({
        success: true,
        originalName: meta.originalName,
        size: meta.size,
        expiresAt: meta.expiresAt,
        downloadToken: password // Simple token for now
    });
});

// Download Endpoint
app.get('/api/download/:id', (req, res) => {
    const fileId = req.params.id;
    const password = req.query.token; // We use the password as the token for simplicity

    if (fileMetadata.has(fileId)) {
        const meta = fileMetadata.get(fileId);

        // Check expiration
        if (new Date() > meta.expiresAt) {
            fileMetadata.delete(fileId);
            return res.status(404).send('File expired');
        }

        // Check password
        if (meta.password && meta.password !== password) {
            return res.status(403).send('Access Denied');
        }

        const filePath = path.join(__dirname, 'uploads', meta.filename);
        res.download(filePath, meta.originalName);
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
