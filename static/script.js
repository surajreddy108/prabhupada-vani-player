// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const audioFileInput = document.getElementById('audioFile');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const transcribeBtn = document.getElementById('transcribeBtn');
const uploadSection = document.getElementById('uploadSection');
const progressSection = document.getElementById('progressSection');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const transcriptionBox = document.getElementById('transcriptionBox');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const newTranscriptionBtn = document.getElementById('newTranscriptionBtn');
const retryBtn = document.getElementById('retryBtn');
const errorMessage = document.getElementById('errorMessage');

let selectedFile = null;
let downloadUrl = null;

// Upload area click handler
uploadArea.addEventListener('click', () => {
    audioFileInput.click();
});

// File input change handler
audioFileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
});

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
});

// Handle file selection
function handleFileSelect(file) {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'flac'];

    if (!allowedExtensions.includes(fileExtension)) {
        showError('Invalid file type. Please upload an audio file (MP3, WAV, M4A, OGG, or FLAC).');
        return;
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('File size exceeds 500MB limit. Please choose a smaller file.');
        return;
    }

    selectedFile = file;

    // Update UI
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    uploadArea.style.display = 'none';
    filePreview.style.display = 'flex';
    transcribeBtn.disabled = false;
}

// Remove file handler
removeFileBtn.addEventListener('click', () => {
    resetUpload();
});

// Reset upload state
function resetUpload() {
    selectedFile = null;
    audioFileInput.value = '';
    uploadArea.style.display = 'block';
    filePreview.style.display = 'none';
    transcribeBtn.disabled = true;
}

// Transcribe button handler
transcribeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Show progress section
    uploadSection.style.display = 'none';
    progressSection.style.display = 'block';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';

    // Animate progress bar
    animateProgress();

    // Create form data
    const formData = new FormData();
    formData.append('audio_file', selectedFile);

    try {
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Show result
            progressFill.style.width = '100%';
            setTimeout(() => {
                showResult(data.transcription, data.download_url);
            }, 500);
        } else {
            showError(data.error || 'Transcription failed. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please check your connection and try again.');
        console.error('Error:', error);
    }
});

// Animate progress bar
function animateProgress() {
    progressFill.style.width = '0%';
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
            progress = 90;
            clearInterval(interval);
        }
        progressFill.style.width = progress + '%';
    }, 500);
}

// Show result
function showResult(transcription, url) {
    downloadUrl = url;
    transcriptionBox.textContent = transcription;

    progressSection.style.display = 'none';
    resultSection.style.display = 'block';
}

// Show error
function showError(message) {
    errorMessage.textContent = message;

    uploadSection.style.display = 'none';
    progressSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'block';
}

// Copy button handler
copyBtn.addEventListener('click', () => {
    const text = transcriptionBox.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L7 13L3 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!';

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
});

// Download button handler
downloadBtn.addEventListener('click', () => {
    if (downloadUrl) {
        window.location.href = downloadUrl;
    }
});

// New transcription button handler
newTranscriptionBtn.addEventListener('click', () => {
    resetUpload();
    uploadSection.style.display = 'block';
    resultSection.style.display = 'none';
});

// Retry button handler
retryBtn.addEventListener('click', () => {
    resetUpload();
    uploadSection.style.display = 'block';
    errorSection.style.display = 'none';
});

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
