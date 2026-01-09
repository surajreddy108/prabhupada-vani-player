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
    }

    showError(error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'none';
        
        const errorDiv = document.getElementById('error');
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Lectures</h3>
            <p>${error.message || 'Unable to load data from Google Sheet'}</p>
            <p><small>Please ensure the Google Sheet is publicly accessible.</small></p>
            <button id="retry-btn" class="retry-btn">
                <i class="fas fa-redo"></i> Try Again
            </button>
            <p style="margin-top: 20px;">
                <a href="https://docs.google.com/spreadsheets/d/1CcDKyg-_JaiKHyvLZv-zn-g2O8b-8wWC-OP9fiaS0_M/edit?gid=366013512#gid=366013512" 
                   target="_blank" class="retry-btn" style="background: #2c3e50;">
                    <i class="fas fa-external-link-alt"></i> Open Google Sheet
                </a>
            </p>
        `;
        
        document.getElementById('retry-btn').addEventListener('click', () => {
            errorDiv.style.display = 'none';
            this.loadLectures();
        });
    }

    populateFilters() {
        const yearFilter = document.getElementById('year-filter');
        const locationFilter = document.getElementById('location-filter');
        
        // Clear existing options (except first)
        while (yearFilter.options.length > 1) yearFilter.remove(1);
        while (locationFilter.options.length > 1) locationFilter.remove(1);
        
        // Get unique years
        const years = [...new Set(this.lectures.map(l => {
            try {
                const date = new Date(l.date);
                const year = date.getFullYear();
                return year && !isNaN(year) ? year : null;
            } catch {
                return null;
            }
        }).filter(year => year))].sort((a, b) => b - a);
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });

        // Get unique locations
        const locations = [...new Set(this.lectures.map(l => l.location).filter(l => l && l.trim()))].sort();
        
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }

    filterLectures(searchTerm = '') {
        const yearFilter = document.getElementById('year-filter').value;
        const locationFilter = document.getElementById('location-filter').value;
        
        this.filteredLectures = this.lectures.filter(lecture => {
            // Search term filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = lecture.title.toLowerCase().includes(searchLower) ||
                                     lecture.location.toLowerCase().includes(searchLower) ||
                                     lecture.date.includes(searchTerm);
                if (!matchesSearch) return false;
            }
            
            // Year filter
            if (yearFilter) {
                try {
                    const lectureYear = new Date(lecture.date).getFullYear();
                    if (lectureYear.toString() !== yearFilter) return false;
                } catch {
                    return false;
                }
            }
            
            // Location filter
            if (locationFilter && lecture.location !== locationFilter) {
                return false;
            }
            
            return true;
        });
        
        this.allLecturesCache = [...this.filteredLectures];
        this.currentPage = 1;
        this.hasMore = this.filteredLectures.length > this.itemsPerPage;
        
        this.updateTabCounts();
        this.switchTab(this.currentTab);
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        this.currentPage = 1;
        
        // Update tab UI
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-content`);
        });

        // Render appropriate content
        let lecturesToRender = [];
        
        switch(tabName) {
            case 'all':
                lecturesToRender = this.allLecturesCache;
                break;
            case 'bhagavad-gita':
                lecturesToRender = this.allLecturesCache.filter(l => 
                    l.title.toLowerCase().includes('bhagavad-gita')
                );
                break;
            case 'srimad-bhagavatam':
                lecturesToRender = this.allLecturesCache.filter(l => 
                    l.title.toLowerCase().includes('srimad-bhagavatam') || 
                    l.title.toLowerCase().includes('bhagavatam')
                );
                break;
            case 'caitanya-caritamrta':
                lecturesToRender = this.allLecturesCache.filter(l => 
                    l.title.toLowerCase().includes('caitanya-caritamrta') ||
                    l.title.toLowerCase().includes('caitanya')
                );
                break;
            case 'other':
                lecturesToRender = this.allLecturesCache.filter(l => 
                    !l.title.toLowerCase().includes('bhagavad-gita') &&
                    !l.title.toLowerCase().includes('bhagavatam') &&
                    !l.title.toLowerCase().includes('caitanya-caritamrta') &&
                    !l.title.toLowerCase().includes('caitanya')
                );
                break;
            case 'favorites':
                lecturesToRender = this.allLecturesCache.filter(l => this.favorites.has(l.link));
                break;
        }
        
        this.renderLectures(lecturesToRender, `${tabName}-list`, true);
    }

    renderAllLectures() {
        this.renderLectures(this.allLecturesCache, 'all-list', true);
    }

    renderLectures(lectures, containerId, reset = false) {
        const container = document.getElementById(containerId);
        const loadMoreContainer = document.getElementById(`${containerId.replace('-list', '-load-more')}`);
        
        if (!container) return;
        
        if (lectures.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No lectures found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            if (loadMoreContainer) loadMoreContainer.innerHTML = '';
            return;
        }
        
        if (reset) {
            container.innerHTML = '';
            this.currentPage = 1;
        }
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const lecturesToShow = lectures.slice(startIndex, endIndex);
        
        // Calculate if there are more items to load
        this.hasMore = endIndex < lectures.length;
        
        // Create lecture elements
        const fragment = document.createDocumentFragment();
        lecturesToShow.forEach((lecture, index) => {
            const element = this.createLectureElement(lecture, startIndex + index);
            fragment.appendChild(element);
        });
        
        if (reset) {
            container.innerHTML = '';
        }
        container.appendChild(fragment);
        
        // Update load more button
        if (loadMoreContainer) {
            if (this.hasMore) {
                loadMoreContainer.innerHTML = `
                    <button class="load-more-btn" id="${containerId}-load-more-btn">
                        <i class="fas fa-spinner" style="display: none;"></i>
                        Load More (${lectures.length - endIndex} remaining)
                    </button>
                `;
                
                document.getElementById(`${containerId}-load-more-btn`).addEventListener('click', () => {
                    this.loadMore();
                });
            } else if (lectures.length > this.itemsPerPage) {
                loadMoreContainer.innerHTML = `
                    <p style="color: #7f8c8d; font-size: 0.9rem;">
                        <i class="fas fa-check-circle"></i> Showing all ${lectures.length} lectures
                    </p>
                `;
            } else {
                loadMoreContainer.innerHTML = '';
            }
        }
    }

    loadMore() {
        if (this.isLoading || !this.hasMore) return;
        
        this.isLoading = true;
        this.currentPage++;
        
        const loadMoreBtn = document.getElementById(`${this.currentTab}-list-load-more-btn`);
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Loading...
            `;
            loadMoreBtn.disabled = true;
        }
        
        // Get current tab's lectures
        let lectures = [];
        switch(this.currentTab) {
            case 'all': lectures = this.allLecturesCache; break;
            case 'bhagavad-gita': 
                lectures = this.allLecturesCache.filter(l => l.title.toLowerCase().includes('bhagavad-gita'));
                break;
            case 'srimad-bhagavatam':
                lectures = this.allLecturesCache.filter(l => 
                    l.title.toLowerCase().includes('srimad-bhagavatam') || 
                    l.title.toLowerCase().includes('bhagavatam')
                );
                break;
            case 'caitanya-caritamrta':
                lectures = this.allLecturesCache.filter(l => 
                    l.title.toLowerCase().includes('caitanya-caritamrta') ||
                    l.title.toLowerCase().includes('caitanya')
                );
                break;
            case 'other':
                lectures = this.allLecturesCache.filter(l => 
                    !l.title.toLowerCase().includes('bhagavad-gita') &&
                    !l.title.toLowerCase().includes('bhagavatam') &&
                    !l.title.toLowerCase().includes('caitanya-caritamrta') &&
                    !l.title.toLowerCase().includes('caitanya')
                );
                break;
            case 'favorites':
                lectures = this.allLecturesCache.filter(l => this.favorites.has(l.link));
                break;
        }
        
        // Render more lectures
        this.renderLectures(lectures, `${this.currentTab}-list`, false);
        
        this.isLoading = false;
    }

    createLectureElement(lecture, index) {
        const isPlaying = this.currentLecture === lecture;
        const isFavorited = this.favorites.has(lecture.link);
        const date = new Date(lecture.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const element = document.createElement('div');
        element.className = `lecture-item ${isPlaying ? 'playing' : ''}`;
        element.dataset.index = index;
        
        element.innerHTML = `
            <div class="lecture-title">${this.escapeHtml(lecture.title)}</div>
            <div class="lecture-meta">
                <span><i class="far fa-calendar"></i> ${formattedDate}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(lecture.location)}</span>
            </div>
            <div class="lecture-actions">
                <button class="play-btn" data-index="${index}">
                    <i class="fas fa-${isPlaying && this.isPlaying ? 'pause' : 'play'}"></i>
                    ${isPlaying && this.isPlaying ? 'Playing' : 'Play'}
                </button>
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-index="${index}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        `;
        
        // Add click handlers
        element.querySelector('.play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.playLecture(lecture);
        });
        
        element.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(lecture);
        });
        
        element.addEventListener('click', (e) => {
            if (!e.target.classList.contains('play-btn') && 
                !e.target.classList.contains('favorite-btn') &&
                !e.target.closest('.play-btn') &&
                !e.target.closest('.favorite-btn')) {
                this.playLecture(lecture);
            }
        });
        
        return element;
    }

    playLecture(lecture) {
        this.currentLecture = lecture;
        const audioPlayer = document.getElementById('audio-player');
        
        // Update audio source
        audioPlayer.src = lecture.link;
        
        // Update UI
        document.getElementById('current-title').textContent = lecture.title;
        document.getElementById('current-details').innerHTML = `
            <div><i class="far fa-calendar"></i> ${new Date(lecture.date).toLocaleDateString()}</div>
            <div><i class="fas fa-map-marker-alt"></i> ${lecture.location}</div>
        `;
        
        // Play audio
        audioPlayer.play().catch(e => {
            console.error('Error playing audio:', e);
            alert('Unable to play audio. The file might not be accessible or your browser might be blocking autoplay.');
        });
        
        // Update lecture items
        this.updatePlayingState();
    }

    togglePlayPause() {
        const audioPlayer = document.getElementById('audio-player');
        
        if (this.isPlaying) {
            audioPlayer.pause();
        } else {
            if (audioPlayer.src) {
                audioPlayer.play();
            } else if (this.filteredLectures.length > 0) {
                this.playLecture(this.filteredLectures[0]);
            }
        }
    }

    playNext() {
        if (!this.currentLecture || this.filteredLectures.length === 0) return;
        
        const currentIndex = this.filteredLectures.indexOf(this.currentLecture);
        const nextIndex = (currentIndex + 1) % this.filteredLectures.length;
        
        this.playLecture(this.filteredLectures[nextIndex]);
    }

    playPrevious() {
        if (!this.currentLecture || this.filteredLectures.length === 0) return;
        
        const currentIndex = this.filteredLectures.indexOf(this.currentLecture);
        const prevIndex = (currentIndex - 1 + this.filteredLectures.length) % this.filteredLectures.length;
        
        this.playLecture(this.filteredLectures[prevIndex]);
    }

    toggleRepeat() {
        this.repeatMode = !this.repeatMode;
        const repeatBtn = document.getElementById('repeat-btn');
        repeatBtn.classList.toggle('active', this.repeatMode);
        repeatBtn.title = `Repeat (${this.repeatMode ? 'On' : 'Off'})`;
    }

    shufflePlaylist() {
        if (this.filteredLectures.length === 0) return;
        
        const shuffled = [...this.filteredLectures];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        this.playLecture(shuffled[0]);
        this.renderLectures(shuffled, `${this.currentTab}-list`, true);
    }

    toggleFavorite(lecture) {
        if (this.favorites.has(lecture.link)) {
            this.favorites.delete(lecture.link);
        } else {
            this.favorites.add(lecture.link);
        }
        
        this.saveFavorites();
        this.updateFavoritesList();
        this.updatePlayingState();
        this.updateTabCounts();
        this.updateStats();
    }

    updateFavoritesList() {
        const favoriteLectures = this.allLecturesCache.filter(l => this.favorites.has(l.link));
        const container = document.getElementById('favorites-list');
        
        if (favoriteLectures.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>No favorites yet</h3>
                    <p>Click the heart icon on any lecture to add it to favorites</p>
                </div>
            `;
        } else {
            this.renderLectures(favoriteLectures, 'favorites-list', true);
        }
    }

    updatePlayingState() {
        // Update all lecture items
        document.querySelectorAll('.lecture-item').forEach(item => {
            const index = parseInt(item.dataset.index);
            const lecture = this.allLecturesCache[index];
            
            if (lecture) {
                item.classList.toggle('playing', lecture === this.currentLecture);
                
                const playBtn = item.querySelector('.play-btn');
                if (playBtn) {
                    playBtn.innerHTML = `
                        <i class="fas fa-${lecture === this.currentLecture && this.isPlaying ? 'pause' : 'play'}"></i>
                        ${lecture === this.currentLecture && this.isPlaying ? 'Playing' : 'Play'}
                    `;
                }
                
                const favoriteBtn = item.querySelector('.favorite-btn');
                if (favoriteBtn) {
                    favoriteBtn.classList.toggle('favorited', this.favorites.has(lecture.link));
                }
            }
        });
    }

    updatePlayButton() {
        const playBtn = document.getElementById('play-pause-btn');
        playBtn.innerHTML = `
            <i class="fas fa-${this.isPlaying ? 'pause' : 'play'}"></i>
        `;
    }

    updateTabCounts() {
        // Update all tab counts
        const tabs = {
            'all': this.allLecturesCache.length,
            'bhagavad-gita': this.allLecturesCache.filter(l => l.title.toLowerCase().includes('bhagavad-gita')).length,
            'srimad-bhagavatam': this.allLecturesCache.filter(l => 
                l.title.toLowerCase().includes('srimad-bhagavatam') || 
                l.title.toLowerCase().includes('bhagavatam')
            ).length,
            'caitanya-caritamrta': this.allLecturesCache.filter(l => 
                l.title.toLowerCase().includes('caitanya-caritamrta') ||
                l.title.toLowerCase().includes('caitanya')
            ).length,
            'other': this.allLecturesCache.filter(l => 
                !l.title.toLowerCase().includes('bhagavad-gita') &&
                !l.title.toLowerCase().includes('bhagavatam') &&
                !l.title.toLowerCase().includes('caitanya-caritamrta') &&
                !l.title.toLowerCase().includes('caitanya')
            ).length,
            'favorites': this.favorites.size
        };
        
        Object.entries(tabs).forEach(([tabName, count]) => {
            const tab = document.querySelector(`.tab[data-tab="${tabName}"] .tab-count`);
            if (tab) {
                tab.textContent = count;
            }
        });
    }

    updateStats() {
        document.getElementById('total-lectures').textContent = this.lectures.length;
        document.getElementById('total-favorites').textContent = this.favorites.size;
        document.getElementById('last-updated').textContent = new Date().toLocaleDateString();
    }

    saveFavorites() {
        try {
            localStorage.setItem('prabhupadaFavorites', JSON.stringify([...this.favorites]));
        } catch (e) {
            console.error('Error saving favorites:', e);
        }
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('prabhupadaFavorites');
            if (saved) {
                this.favorites = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading favorites:', e);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.player = new PrabhupadaVaniPlayer();
});
