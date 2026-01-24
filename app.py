from flask import Flask, render_template, request, jsonify, send_file
import os
from werkzeug.utils import secure_filename
from pathlib import Path
import tempfile
from aa import transcribe_mp3_parallel

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'm4a', 'ogg', 'flac'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/health')
def health():
    """Health check endpoint for Render."""
    return jsonify({'status': 'healthy', 'message': 'Server is running'}), 200

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Handle audio file upload and transcription."""
    try:
        # Check if file is present
        if 'audio_file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['audio_file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Generate output filename
        output_filename = f"{Path(filename).stem}_transcription.txt"
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        # Perform transcription
        print(f"Starting transcription for: {filename}")
        transcription = transcribe_mp3_parallel(
            filepath,
            output_file=output_path,
            chunk_length_ms=30000,
            max_workers=6
        )
        
        # Clean up uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)
        
        if transcription:
            return jsonify({
                'success': True,
                'transcription': transcription,
                'download_url': f'/download/{output_filename}'
            })
        else:
            return jsonify({'error': 'Transcription failed'}), 500
            
    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/download/<filename>')
def download(filename):
    """Download the transcription file."""
    try:
        filepath = os.path.join(app.config['OUTPUT_FOLDER'], secure_filename(filename))
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True, download_name=filename)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
