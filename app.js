class PrabhupadaVaniPlayer {
    constructor() {
        this.lectures = [];
        this.currentLecture = null;
        this.currentTab = 'all';
        this.favorites = new Set();
        this.isPlaying = false;
        this.repeatMode = false;
        this.filteredLectures = [];
        this.allLecturesCache = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
        this.hasMore = true;
        
        // Google Sheet configuration
        this.sheetId = '1CcDKyg-_JaiKHyvLZv-zn-g2O8b-8wWC-OP9fiaS0_M';
        this.sheetName = 'Prabhupadvani';
        
        this.init();
    }

    async init() {
        this.loadFavorites();
        this.setupEventListeners();
        await this.loadLectures();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterLectures(e.target.value);
                this.currentPage = 1;
                this.hasMore = true;
            }, 300);
        });

        // Year filter
        document.getElementById('year-filter').addEventListener('change', (e) => {
            this.filterLectures(searchInput.value);
            this.currentPage = 1;
            this.hasMore = true;
        });

        // Location filter
        document.getElementById('location-filter').addEventListener('change', (e) => {
            this.filterLectures(searchInput.value);
            this.currentPage = 1;
            this.hasMore = true;
        });

        // Clear filters
        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            searchInput.value = '';
            document.getElementById('year-filter').value = '';
            document.getElementById('location-filter').value = '';
            this.filterLectures('');
            this.currentPage = 1;
            this.hasMore = true;
        });

        // Shuffle button
        document.getElementById('shuffle-btn').addEventListener('click', () => {
            this.shufflePlaylist();
        });

        // Player controls
        const audioPlayer = document.getElementById('audio-player');
        
        document.getElementById('play-pause-btn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        document.getElementById('prev-btn').addEventListener('click', () => {
            this.playPrevious();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.playNext();
        });

        document.getElementById('repeat-btn').addEventListener('click', () => {
            this.toggleRepeat();
        });

        document.getElementById('volume-slider').addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value;
        });

        // Audio events
        audioPlayer.addEventListener('ended', () => {
            if (this.repeatMode) {
                audioPlayer.currentTime = 0;
                audioPlayer.play();
            } else {
                this.playNext();
            }
        });

        audioPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.updatePlayingState();
        });

        audioPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.updatePlayingState();
        });

        // Infinite scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading && this.hasMore) {
                    this.loadMore();
                }
            });
        }, {
            rootMargin: '100px'
        });

        // Observe all load-more containers
        document.querySelectorAll('.load-more-container').forEach(container => {
            observer.observe(container);
        });
    }

    async loadLectures() {
        try {
            // Show loading state
            document.getElementById('loading').style.display = 'block';
            document.getElementById('error').style.display = 'none';
            document.getElementById('content').style.display = 'none';
            
            // Using Google Sheets API v4 with public access
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${this.sheetName}?key=AIzaSyDdY_IwGWjWFWJN-7G7LJ3jJqJkq9YQ9i0`;
            
            // Alternative: Use CSV export for public sheets
            const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${this.sheetName}`;
            
            const response = await fetch(csvUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }
            
            const csvText = await response.text();
            
            // Parse CSV data
            this.lectures = this.parseCSV(csvText);
            
            if (this.lectures.length === 0) {
                throw new Error('No lectures found in the sheet. Please check the sheet format.');
            }
            
            // Hide loading, show content
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'block';
            
            // Initialize filters and render
            this.filteredLectures = [...this.lectures];
            this.allLecturesCache = [...this.lectures];
            this.populateFilters();
            this.renderAllLectures();
            this.updateTabCounts();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading lectures:', error);
            this.showError(error);
        }
    }

    parseCSV(csvText) {
        const lectures = [];
        const rows = csvText.split('\n').filter(row => row.trim());
        
        if (rows.length === 0) return lectures;
        
        // Parse header row to get column indices
        const headers = this.parseCSVRow(rows[0]).map(h => h.toLowerCase());
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const locationIdx = headers.findIndex(h => h.includes('location'));
        const titleIdx = headers.findIndex(h => h.includes('title'));
        const linkIdx = headers.findIndex(h => h.includes('link'));
        
        // Process data rows
        for (let i = 1; i < rows.length; i++) {
            const columns = this.parseCSVRow(rows[i]);
            
            if (columns.length >= 4) {
                const lecture = {
                    date: columns[dateIdx] || '',
                    location: columns[locationIdx] || '',
                    title: columns[titleIdx] || '',
                    link: columns[linkIdx] || ''
                };
                
                // Clean and validate data
                lecture.date = this.cleanDate(lecture.date);
                lecture.location = lecture.location || 'Unknown';
                lecture.title = lecture.title.trim();
                lecture.link = lecture.link.trim();
                
                // Only add if we have a title and link
                if (lecture.title && lecture.link) {
                    lectures.push(lecture);
                }
            }
        }
        
        // Sort by date (newest first)
        return lectures.sort((a, b) => {
            try {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            } catch {
                return 0;
            }
        });
    }

    parseCSVRow(row) {
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1];
            
            if (char === '"' && !inQuotes) {
                inQuotes = true;
            } else if (char === '"' && inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else if (char === '"' && inQuotes) {
                inQuotes = false;
            } else if (char === ',' && !inQuotes) {
                columns.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        columns.push(current);
        return columns.map(col => col.trim());
    }

    cleanDate(dateStr) {
        if (!dateStr) return '';
        
        // Handle various date formats
        let cleaned = dateStr.toString();
        
        // Replace "Sept." with "Sep"
        cleaned = cleaned.replace(/Sept\./g, 'Sep');
        
        // Remove time portion if present
        cleaned = cleaned.split(' ')[0];
        
        // Try to parse the date
        try {
            const date = new Date(cleaned);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch {
            // If parsing fails, return original
        }
        
        return cleaned;
