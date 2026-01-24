# Audio Transcription Web App

A beautiful, modern web application for transcribing audio files to text using Google's Speech Recognition API. Built with Flask and featuring a stunning dark-themed UI with smooth animations.

## Features

- 🎵 **Multiple Audio Format Support**: MP3, WAV, M4A, OGG, FLAC
- 🚀 **Parallel Processing**: Fast transcription using multi-threaded processing
- 🎨 **Modern UI**: Beautiful dark theme with gradient accents and smooth animations
- 📥 **Drag & Drop**: Easy file upload with drag-and-drop support
- 💾 **Download Results**: Download transcriptions as text files
- 📋 **Copy to Clipboard**: Quick copy functionality
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Screenshots

![Upload Interface](screenshots/upload.png)
![Transcription Result](screenshots/result.png)

## Installation

### Prerequisites

- Python 3.8 or higher
- FFmpeg (required for audio processing)

### Install FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

### Setup

1. Clone this repository:
```bash
git clone https://github.com/yourusername/audio-transcription-webapp.git
cd audio-transcription-webapp
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and navigate to:
```
http://localhost:5000
```

## Usage

1. **Upload Audio File**: Click the upload area or drag and drop an audio file (MP3, WAV, M4A, OGG, or FLAC)
2. **Start Transcription**: Click the "Start Transcription" button
3. **Wait for Processing**: The app will process your audio in parallel chunks for faster transcription
4. **View Results**: See your transcription and download it as a text file

## How It Works

The application uses:
- **Flask** for the web framework
- **SpeechRecognition** with Google's Speech Recognition API for transcription
- **pydub** for audio processing and chunking
- **ThreadPoolExecutor** for parallel processing of audio chunks

The transcription process:
1. Converts uploaded audio to WAV format
2. Splits audio into 30-second chunks with overlap
3. Processes chunks in parallel using multiple threads
4. Combines results into a complete transcription

## Configuration

You can modify these settings in `app.py`:

- `MAX_CONTENT_LENGTH`: Maximum file size (default: 500MB)
- `chunk_length_ms`: Length of audio chunks (default: 30000ms)
- `max_workers`: Number of parallel workers (default: 6)

## Deployment

### Deploy to Heroku

1. Create a `Procfile`:
```
web: gunicorn app:app
```

2. Add gunicorn to requirements.txt:
```bash
echo "gunicorn==21.2.0" >> requirements.txt
```

3. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

### Deploy to GitHub Pages (Static Version)

For a static version without backend processing, you would need to use a client-side transcription service or API.

## Project Structure

```
audio-transcription-webapp/
├── app.py                 # Flask application
├── aa.py                  # Transcription logic
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── style.css         # Styles
│   └── script.js         # JavaScript
├── uploads/              # Temporary upload folder
└── outputs/              # Transcription output folder
```

## Limitations

- Uses Google's free Speech Recognition API (has rate limits)
- Maximum file size: 500MB
- Requires internet connection for transcription
- Best results with clear audio and minimal background noise

## Future Enhancements

- [ ] Support for multiple languages
- [ ] Real-time transcription progress
- [ ] User authentication
- [ ] Transcription history
- [ ] Support for video files
- [ ] Custom API key configuration
- [ ] Offline transcription options

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Speech Recognition API
- Flask framework
- pydub library
- SpeechRecognition library

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ by [Your Name]
