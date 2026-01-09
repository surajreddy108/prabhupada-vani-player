import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, List, Search } from 'lucide-react';

const MusicPlayer = () => {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const audioRef = useRef(null);

  useEffect(() => {
    fetchPlaylist();
  }, []);

  const fetchPlaylist = async () => {
    try {
      setLoading(true);
      const sheetId = '1CcDKyg-_JaiKHyvLZv-zn-g2O8b-8wWC-OP9fiaS0_M';
      const gid = '551203411';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      
      const response = await fetch(csvUrl);
      const text = await response.text();
      
      const lines = text.split('\n');
      const tracks = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const match = line.match(/^"?([^"]*?)"?,\s*"?([^"]*?)"?(?:,|$)/);
        if (match) {
          const title = match[1].trim();
          const link = match[2].trim();
          
          if (title && link && link.startsWith('http')) {
            tracks.push({ title, link });
          }
        }
      }
      
      setPlaylist(tracks);
      setLoading(false);
    } catch (err) {
      setError('Failed to load playlist. Please check your internet connection.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => playNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playTrack = (index) => {
    setCurrentTrack(index);
    setIsPlaying(false);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play();
        setIsPlaying(true);
      }
    }, 100);
  };

  const playNext = () => {
    const nextTrack = (currentTrack + 1) % playlist.length;
    playTrack(nextTrack);
  };

  const playPrevious = () => {
    const prevTrack = currentTrack === 0 ? playlist.length - 1 : currentTrack - 1;
    playTrack(prevTrack);
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredPlaylist = playlist.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-800 text-lg">Loading spiritual teachings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchPlaylist}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-orange-800 mb-2">
            🕉️ Srila Prabhupad Vani
          </h1>
          <p className="text-orange-600">Spiritual Audio Teachings</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className={`${showPlaylist ? 'md:col-span-2' : 'md:col-span-3'}`}>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
                <h2 className="text-2xl font-bold mb-2 truncate">
                  {playlist[currentTrack]?.title || 'No track selected'}
                </h2>
                <p className="text-orange-100">Track {currentTrack + 1} of {playlist.length}</p>
              </div>

              <div className="p-8">
                <audio ref={audioRef} src={playlist[currentTrack]?.link} />

                <div className="mb-6">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(currentTime / duration) * 100 || 0}
                    onChange={handleSeek}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #ea580c ${(currentTime / duration) * 100}%, #fed7aa ${(currentTime / duration) * 100}%)`
                    }}
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mb-6">
                  <button
                    onClick={playPrevious}
                    className="p-3 bg-orange-100 rounded-full hover:bg-orange-200 transition"
                  >
                    <SkipBack className="w-6 h-6 text-orange-600" />
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    className="p-6 bg-orange-600 rounded-full hover:bg-orange-700 transition shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>
                  
                  <button
                    onClick={playNext}
                    className="p-3 bg-orange-100 rounded-full hover:bg-orange-200 transition"
                  >
                    <SkipForward className="w-6 h-6 text-orange-600" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-orange-600" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={(e) => setVolume(e.target.value / 100)}
                    className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="md:hidden mt-4 w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2"
            >
              <List className="w-5 h-5" />
              {showPlaylist ? 'Hide Playlist' : 'Show Playlist'}
            </button>
          </div>

          <div className={`${showPlaylist ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden h-[600px] flex flex-col">
              <div className="p-4 bg-orange-50 border-b border-orange-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teachings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredPlaylist.map((track, index) => {
                  const actualIndex = playlist.findIndex(t => t.title === track.title);
                  return (
                    <button
                      key={index}
                      onClick={() => playTrack(actualIndex)}
                      className={`w-full text-left p-4 hover:bg-orange-50 transition border-b border-gray-100 ${
                        currentTrack === actualIndex ? 'bg-orange-100 border-l-4 border-l-orange-600' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-800 text-sm line-clamp-2">
                        {track.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Track {actualIndex + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-8 text-gray-600 text-sm">
          <p>🙏 Hare Krishna 🙏</p>
        </footer>
      </div>
    </div>
  );
};

export default MusicPlayer;
