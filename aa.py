import speech_recognition as sr
from pydub import AudioSegment
from pydub.silence import split_on_silence
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
from pathlib import Path

def convert_to_wav(input_file, output_wav="temp_audio.wav"):
    """Convert audio file to WAV format."""
    print(f"Converting {input_file} to WAV format...")
    audio = AudioSegment.from_file(input_file)
    audio.export(output_wav, format="wav")
    print(f"Conversion complete: {output_wav}")
    return output_wav

def split_audio_into_chunks(audio_file, chunk_length_ms=30000, overlap_ms=500):
    """
    Split audio into smaller chunks for parallel processing.
    
    Args:
        audio_file: Path to WAV audio file
        chunk_length_ms: Length of each chunk in milliseconds (default: 30 seconds)
        overlap_ms: Overlap between chunks to avoid cutting words (default: 500ms)
    
    Returns:
        list: List of audio chunks
    """
    print(f"Loading audio file: {audio_file}")
    audio = AudioSegment.from_wav(audio_file)
    
    chunks = []
    total_length = len(audio)
    
    print(f"Total audio length: {total_length/1000:.2f} seconds")
    print(f"Splitting into ~{chunk_length_ms/1000} second chunks...")
    
    for i in range(0, total_length, chunk_length_ms - overlap_ms):
        chunk = audio[i:i + chunk_length_ms]
        chunks.append((i, chunk))
    
    print(f"Created {len(chunks)} chunks")
    return chunks

def transcribe_chunk(chunk_data):
    """
    Transcribe a single audio chunk.
    
    Args:
        chunk_data: Tuple of (index, audio_chunk)
    
    Returns:
        Tuple of (index, transcription_text)
    """
    index, chunk = chunk_data
    recognizer = sr.Recognizer()
    
    # Export chunk to temporary file
    temp_file = f"temp_chunk_{index}.wav"
    
    try:
        chunk.export(temp_file, format="wav")
        
        with sr.AudioFile(temp_file) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.2)
            audio_data = recognizer.record(source)
        
        # Transcribe
        text = recognizer.recognize_google(audio_data)
        print(f"✓ Chunk {index//1000}s transcribed")
        
        return (index, text)
        
    except sr.UnknownValueError:
        print(f"✗ Chunk {index//1000}s: Could not understand audio")
        return (index, "")
    except sr.RequestError as e:
        print(f"✗ Chunk {index//1000}s: API error - {e}")
        return (index, "")
    except Exception as e:
        print(f"✗ Chunk {index//1000}s: Error - {e}")
        return (index, "")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file):
            os.remove(temp_file)

def transcribe_audio_parallel(audio_file, output_file=None, chunk_length_ms=30000, max_workers=4):
    """
    Transcribe audio file using parallel processing.
    
    Args:
        audio_file: Path to audio file (WAV format)
        output_file: Optional path to save transcription
        chunk_length_ms: Length of each chunk in milliseconds
        max_workers: Number of parallel workers (default: 4)
    
    Returns:
        str: Complete transcription
    """
    # Split audio into chunks
    chunks = split_audio_into_chunks(audio_file, chunk_length_ms)
    
    print(f"\nStarting parallel transcription with {max_workers} workers...")
    
    # Process chunks in parallel
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_chunk = {executor.submit(transcribe_chunk, chunk): chunk for chunk in chunks}
        
        for future in as_completed(future_to_chunk):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"Error processing chunk: {e}")
    
    # Sort results by index and combine
    results.sort(key=lambda x: x[0])
    full_transcription = " ".join([text for _, text in results if text])
    
    print("\n--- Transcription Complete ---")
    print(full_transcription)
    print("-----------------------------\n")
    
    # Save to file if specified
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(full_transcription)
        print(f"Transcription saved to: {output_file}")
    
    return full_transcription

def transcribe_mp3_parallel(mp3_file_path, output_file=None, chunk_length_ms=30000, 
                           max_workers=4, keep_wav=False):
    """
    Transcribe an MP3 file using parallel processing.
    
    Args:
        mp3_file_path: Path to the MP3 file
        output_file: Optional path to save transcription
        chunk_length_ms: Length of each chunk in milliseconds (default: 30 seconds)
        max_workers: Number of parallel workers (default: 4)
        keep_wav: Whether to keep the temporary WAV file (default: False)
    
    Returns:
        str: Transcribed text
    """
    # Convert MP3 to WAV
    wav_file = mp3_file_path.replace('.mp3', '_temp.wav')
    
    try:
        wav_file = convert_to_wav(mp3_file_path, wav_file)
        
        # Transcribe with parallel processing
        transcription = transcribe_audio_parallel(
            wav_file, 
            output_file=output_file,
            chunk_length_ms=chunk_length_ms,
            max_workers=max_workers
        )
        
        # Clean up temporary WAV file
        if not keep_wav and os.path.exists(wav_file):
            os.remove(wav_file)
            print(f"Temporary WAV file removed: {wav_file}")
        
        return transcription
        
    except Exception as e:
        print(f"Error processing MP3: {e}")
        # Clean up on error
        if os.path.exists(wav_file):
            os.remove(wav_file)
        return None

if __name__ == "__main__":
    # Example usage for single MP3 file
    mp3_file = "01_-_Nityananda_Charan_Pr_BG_-_The_Introduction.mp3"  # Replace with your MP3 file path
    
    # Transcribe with parallel processing
    # chunk_length_ms: smaller chunks = more parallelization but more API calls
    # max_workers: number of parallel threads (4-8 recommended)
    transcription = transcribe_mp3_parallel(
        mp3_file, 
        output_file="transcription.txt",
        chunk_length_ms=30000,  # 30 second chunks
        max_workers=6  # 6 parallel workers
    )
    
    # Batch process multiple MP3 files
    # import glob
    # for mp3_file in glob.glob("*.mp3"):
    #     output = mp3_file.replace('.mp3', '_transcription.txt')
    #     print(f"\n{'='*50}")
    #     print(f"Processing: {mp3_file}")
    #     print('='*50)
    #     transcribe_mp3_parallel(mp3_file, output_file=output, max_workers=6)