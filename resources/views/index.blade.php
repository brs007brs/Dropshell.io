<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{ $seo['description'] }}">
    <meta name="keywords"
        content="file sharing, secure transfer, anonymous upload, 20gb limit, dropshell, wetransfer alternative">
    <meta name="author" content="Dropshell Inc.">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $seo['og_title'] }}">
    <meta property="og:description" content="{{ $seo['og_description'] }}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $seo['og_title'] }}">
    <meta name="twitter:description" content="{{ $seo['og_description'] }}">

    <title>{{ $seo['title'] }}</title>
    <link rel="stylesheet" href="{{ asset('style.css') }}">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">
</head>

<body>
    <div class="background-grid"></div>
    <div class="background-glow"></div>

    <div class="container">
        <header>
            <div class="logo">DROPSHELL<span class="dot">.</span></div>
        </header>

        <main id="main-content">
            <!-- Upload View -->
            <div id="upload-view" class="card active">
                <div class="terminal-header">
                    <div class="terminal-controls">
                        <div class="control red"></div>
                        <div class="control yellow"></div>
                        <div class="control green"></div>
                    </div>
                    <div class="terminal-title">user@dropshell:~/upload</div>
                </div>
                <div class="card-content">
                    <div class="drop-zone" id="drop-zone">
                        <h2>initiate_upload</h2>
                        <p>> Drag & drop files here or <span class="highlight">browse</span></p>
                        <input type="file" id="file-input" hidden>
                    </div>

                    <!-- Security Options -->
                    <div id="security-options" class="security-options hidden">
                        <div class="input-group">
                            <label>> set_password (optional):</label>
                            <input type="password" id="upload-password" placeholder="******">
                        </div>
                        <div class="input-group">
                            <label>> set_expiration:</label>
                            <select id="upload-expiration">
                                <option value="1">1 Hour</option>
                                <option value="3">3 Hours</option>
                                <option value="6">6 Hours</option>
                                <option value="24" selected>24 Hours</option>
                                <option value="72">3 Days</option>
                                <option value="168">7 Days</option>
                            </select>
                        </div>
                    </div>

                    <div id="file-info" class="file-info hidden">
                        <div class="file-details">
                            <span id="filename">example.zip</span>
                            <span id="filesize">2.4 MB</span>
                        </div>
                        <button id="remove-file" class="icon-btn">&times;</button>
                    </div>
                    <button id="transfer-btn" class="btn primary hidden">EXECUTE TRANSFER</button>
                </div>
            </div>

            <!-- Progress View -->
            <div id="progress-view" class="card">
                <div class="terminal-header">
                    <div class="terminal-controls">
                        <div class="control red"></div>
                        <div class="control yellow"></div>
                        <div class="control green"></div>
                    </div>
                    <div class="terminal-title">user@dropshell:~/uploading</div>
                </div>
                <div class="card-content">
                    <div class="progress-container">
                        <div class="terminal-progress-bar" id="terminal-progress">
                            [....................]
                        </div>
                        <p class="status-text" id="progress-percent">0%</p>
                        <p class="status-text">Uploading data packets...</p>
                    </div>
                </div>
            </div>

            <!-- Success View -->
            <div id="success-view" class="card">
                <div class="terminal-header">
                    <div class="terminal-controls">
                        <div class="control red"></div>
                        <div class="control yellow"></div>
                        <div class="control green"></div>
                    </div>
                    <div class="terminal-title">user@dropshell:~/success</div>
                </div>
                <div class="card-content">
                    <h2>TRANSFER COMPLETE</h2>
                    <p>> File successfully uploaded to secure node.</p>

                    <div class="link-container">
                        <input type="text" id="share-link" readonly>
                        <button id="copy-btn" class="btn secondary">COPY LINK</button>
                    </div>

                    <button id="upload-another" class="btn text">send_another_file</button>
                </div>
            </div>

            <!-- Download View -->
            <div id="download-view" class="card">
                <div class="terminal-header">
                    <div class="terminal-controls">
                        <div class="control red"></div>
                        <div class="control yellow"></div>
                        <div class="control green"></div>
                    </div>
                    <div class="terminal-title">user@dropshell:~/download</div>
                </div>
                <div class="card-content">
                    <!-- Password Prompt -->
                    <div id="password-prompt" class="hidden">
                        <h2>ACCESS DENIED</h2>
                        <p>> This file is password protected.</p>
                        <div class="input-group">
                            <label>> enter_password:</label>
                            <input type="password" id="download-password" placeholder="******">
                        </div>
                        <button id="unlock-btn" class="btn primary">UNLOCK FILE</button>
                    </div>

                    <!-- File Details -->
                    <div id="download-details" class="hidden">
                        <div class="download-header">
                            <div class="file-details-large">
                                <h2 id="dl-filename">Loading...</h2>
                                <p id="dl-filesize">...</p>
                                <p id="dl-expiration" class="status-text" style="margin-top: 10px; font-size: 0.8rem;">
                                </p>
                            </div>
                        </div>
                        <button id="download-btn" class="btn primary">DOWNLOAD FILE</button>
                    </div>
                </div>
            </div>
        </main>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                </div>
                <h3>Enterprise-Grade Security</h3>
                <p>Military-grade encryption protects your files during transfer and storage.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                </div>
                <h3>Blazing Fast Transfers</h3>
                <p>High-performance infrastructure ensures rapid uploads up to 20GB.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                </div>
                <h3>Zero Friction Sharing</h3>
                <p>No account creation needed. Upload, share, and collaborate instantly.</p>
            </div>
        </div>

        <footer>
            <div class="footer-links">
                <a href="#" data-modal="terms">Terms of Service</a>
                <a href="#" data-modal="privacy">Privacy Policy</a>
                <a href="#" data-modal="about">About Us</a>
                <a href="#" data-modal="contact">Contact Support</a>
            </div>
            <p>&copy; 2025 Dropshell</p>
        </footer>
    </div>

    <!-- Modal Container -->
    <div id="modal-overlay" class="modal-overlay">
        <div class="modal-content">
            <button id="modal-close" class="modal-close">&times;</button>
            <div id="modal-body" class="modal-body">
                <!-- Content injected via JS -->
            </div>
        </div>
    </div>

    <script src="{{ asset('script.js') }}"></script>
</body>

</html>