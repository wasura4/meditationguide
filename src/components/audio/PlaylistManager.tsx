'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { KamatahanAudio } from '@/types/admin';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { recordAudioListen } from '@/lib/metricsService';
import { usePlayer } from '@/contexts/PlayerContext';

interface Playlist {
  id: string;
  name: string;
  description: string;
  audioFiles: KamatahanAudio[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '', isPublic: false });
  const [availableAudio, setAvailableAudio] = useState<KamatahanAudio[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string[]>([]);
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  
  // Playlist playback state
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const listenedThisSessionRef = useRef<Set<string>>(new Set());
  
  const { showToast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const player = usePlayer();

  useEffect(() => {
    if (user) {
      fetchPlaylists();
      fetchAvailableAudio();
    }
  }, [user]);

  // Autostart from query param ?start=<playlistId>
  useEffect(() => {
    const id = searchParams?.get('start');
    if (!id || playlists.length === 0) return;
    const p = playlists.find((x) => x.id === id);
    if (p) startPlaylist(p);
  }, [searchParams, playlists]);

  // Audio event handlers
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !currentPlaylist) return;

    const currentTrack = currentPlaylist.audioFiles[currentTrackIndex];
    if (!currentTrack) return;

    // Set audio source
    audioElement.src = currentTrack.fileUrl;
    
    const updateTime = () => setCurrentTime(audioElement.currentTime);
    const updateDuration = () => setDuration(audioElement.duration);
    const handleEnded = () => {
      // Auto-play next track when current track ends
      if (currentTrackIndex < (currentPlaylist?.audioFiles.length || 0) - 1) {
        nextTrack();
      } else {
        // Playlist finished
        setIsPlaying(false);
        showToast({
          type: 'info',
          title: 'Playlist Complete',
          message: `${currentPlaylist.name} has finished playing.`,
          duration: 3000
        });
      }
    };
    const handlePlay = () => {
      // Count a listen once per track per page session to avoid spam on pause/resume
      const track = currentPlaylist.audioFiles[currentTrackIndex];
      if (!track?.id) return;
      if (!listenedThisSessionRef.current.has(track.id)) {
        listenedThisSessionRef.current.add(track.id);
        recordAudioListen(track.id, user?.id);
      }
    };
    const handleError = (e: Event) => {
      console.error('âŒ Audio playback error:', e);
      setIsPlaying(false);
      showToast({
        type: 'error',
        title: 'Playback Error',
        message: 'Failed to play audio. Trying next track...',
        duration: 3000
      });
      // Try next track on error
      setTimeout(() => nextTrack(), 1000);
    };

    audioElement.addEventListener('timeupdate', updateTime);
    audioElement.addEventListener('loadedmetadata', updateDuration);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('error', handleError);

    // Auto-play if playlist is active
    if (isPlaying) {
      audioElement.play().catch((error) => {
        console.error('âŒ Error playing audio:', error);
        setIsPlaying(false);
      });
    }

    return () => {
      audioElement.removeEventListener('timeupdate', updateTime);
      audioElement.removeEventListener('loadedmetadata', updateDuration);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('play', handlePlay);
    };
  }, [currentPlaylist, currentTrackIndex, isPlaying, showToast, user?.id]);

  const fetchPlaylists = async () => {    try {      setLoading(true);
      const playlistsRef = collection(db, 'playlists');
      const qMine = query(playlistsRef, where('userId', '==', user?.id));
      const snapMine = await getDocs(qMine);
      const mine: Playlist[] = [];
      snapMine.forEach((d) => {
        const raw = d.data() as Record<string, unknown>;
        mine.push({
          id: d.id,
          name: String(raw.name || ''),
          description: String(raw.description || ''),
          audioFiles: (raw.audioFiles as KamatahanAudio[]) || [],
          isPublic: Boolean(raw.isPublic),
          createdAt: (raw.createdAt as Date) || new Date(),
          updatedAt: (raw.updatedAt as Date) || new Date(),
          userId: String(raw.userId || ''),
        });
      });

      const qPublic = query(playlistsRef, where('isPublic', '==', true));
      const snapPublic = await getDocs(qPublic);
      const pub: Playlist[] = [];
      snapPublic.forEach((d) => {
        const raw = d.data() as Record<string, unknown>;
        pub.push({
          id: d.id,
          name: String(raw.name || ''),
          description: String(raw.description || ''),
          audioFiles: (raw.audioFiles as KamatahanAudio[]) || [],
          isPublic: Boolean(raw.isPublic),
          createdAt: (raw.createdAt as Date) || new Date(),
          updatedAt: (raw.updatedAt as Date) || new Date(),
          userId: String(raw.userId || ''),
        });
      });
      const mergedMap = new Map<string, Playlist>();
      [...pub, ...mine].forEach(p => mergedMap.set(p.id, p));
      const merged = Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPlaylists(merged);
    } catch (error) {      console.error('Error fetching playlists:', error);
      showToast({ type: 'error', title: 'Error', message: 'Failed to load playlists. Please try again.', duration: 3000 });
    } finally {      setLoading(false);
    }
  };

  const fetchAvailableAudio = async () => {
    try {
      console.log('ðŸ” Fetching available audio for playlist creation...');
      const audioRef = collection(db, 'kamatahan_audio');
      // Remove orderBy to avoid potential index issues
      // const q = query(audioRef, orderBy('uploadDate', 'desc'));
      const q = query(audioRef);
      const querySnapshot = await getDocs(q);
      
      console.log('ðŸ“Š Available audio query snapshot size:', querySnapshot.size);
      
      const audio: KamatahanAudio[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('ðŸŽµ Available audio file:', { id: doc.id, title: data.title, category: data.category });
        audio.push({ id: doc.id, ...data } as KamatahanAudio);
      });
      
      console.log('ðŸŽµ Total available audio files:', audio.length);
      setAvailableAudio(audio);
    } catch (error) {
      console.error('âŒ Error fetching available audio:', error);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylist.name.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Playlist name is required.',
        duration: 3000
      });
      return;
    }

    // Check if user is authenticated
    if (!user?.id) {
      console.error('âŒ No user ID available for playlist creation');
      showToast({
        type: 'error',
        title: 'Authentication Error',
        message: 'You must be logged in to create playlists.',
        duration: 5000
      });
      return;
    }

    console.log('ðŸŽµ Creating playlist with data:', {
      name: newPlaylist.name,
      description: newPlaylist.description,
      isPublic: newPlaylist.isPublic,
      selectedAudioIds: selectedAudio,
      availableAudioCount: availableAudio.length,
      userId: user.id
    });

    try {
      const selectedAudioFiles = availableAudio.filter(audio => selectedAudio.includes(audio.id));
      
      console.log('ðŸŽµ Selected audio files:', selectedAudioFiles.map(a => ({ id: a.id, title: a.title })));
      
      const playlistData = {
        name: newPlaylist.name.trim(),
        description: newPlaylist.description.trim(),
        audioFiles: selectedAudioFiles,
        isPublic: newPlaylist.isPublic,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user?.id
      };

      console.log('ðŸŽµ Final playlist data:', playlistData);
      
      // Test if we can access the playlists collection
      console.log('ðŸ” Testing access to playlists collection...');
      const playlistsRef = collection(db, 'playlists');
      console.log('ðŸ” Playlists collection reference:', playlistsRef);
      
      // Try to add the document
      console.log('ðŸ” Attempting to add playlist document...');
      const docRef = await addDoc(playlistsRef, playlistData);
      console.log('âœ… Playlist created successfully with ID:', docRef.id);
      
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Playlist created successfully!',
        duration: 3000
      });

      setNewPlaylist({ name: '', description: '', isPublic: false });
      setSelectedAudio([]);
      setShowCreateForm(false);
      fetchPlaylists();
    } catch (error) {
      console.error('âŒ Error creating playlist:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('âŒ Error name:', error.name);
        console.error('âŒ Error message:', error.message);
        console.error('âŒ Error stack:', error.stack);
      }
      
      // Check if it's a Firestore permission error
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('âŒ Firestore error code:', (error as { code: string }).code);
        console.error('âŒ Firestore error details:', (error as { details?: string }).details);
      }
      
      // Show more specific error message
      let errorMessage = 'Failed to create playlist. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = 'Permission denied. You may not have access to create playlists.';
        } else if (error.message.includes('unauthenticated')) {
          errorMessage = 'You must be logged in to create playlists.';
        } else if (error.message.includes('invalid-argument')) {
          errorMessage = 'Invalid playlist data. Please check your input.';
        }
      }
      
      showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000
      });
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    const target = playlists.find(p => p.id === playlistId);
    // Only allow deleting playlists created by this user (not admin-created/public)
    if (!target || target.userId !== user?.id) {
      showToast({
        type: 'warning',
        title: 'Not Allowed',
        message: 'You can only delete playlists you created.',
        duration: 3000,
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await deleteDoc(doc(db, 'playlists', playlistId));

      showToast({
        type: 'success',
        title: 'Success',
        message: 'Playlist deleted successfully!',
        duration: 3000,
      });

      fetchPlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete playlist. Please try again.',
        duration: 3000,
      });
    }
  };

  const toggleAudioSelection = (audioId: string) => {
    console.log('ðŸŽµ Toggling audio selection:', {
      audioId,
      currentSelection: selectedAudio,
      willAdd: !selectedAudio.includes(audioId)
    });
    
    setSelectedAudio(prev => {
      const newSelection = prev.includes(audioId) 
        ? prev.filter(id => id !== audioId)
        : [...prev, audioId];
      
      console.log('ðŸŽµ New audio selection:', newSelection);
      return newSelection;
    });
  };

  // Filter available audio based on search query
  const filteredAvailableAudio = availableAudio.filter((audio) => {
    const searchLower = audioSearchQuery.toLowerCase();
    return (
      audio.title.toLowerCase().includes(searchLower) ||
      audio.description.toLowerCase().includes(searchLower) ||
      audio.category.toLowerCase().includes(searchLower) ||
      audio.language.toLowerCase().includes(searchLower)
    );
  });

  // Playlist playback functions
  const startPlaylist = (playlist: Playlist) => {
    if (playlist.audioFiles.length === 0) {
      showToast({
        type: 'error',
        title: 'Empty Playlist',
        message: 'This playlist has no audio files.',
        duration: 3000
      });
      return;
    }

    player.start({ id: playlist.id, name: playlist.name, audioFiles: playlist.audioFiles });
    setCurrentPlaylist(null);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    
    showToast({
      type: 'success',
      title: 'Playlist Started',
      message: `Now playing: ${playlist.name}`,
      duration: 2000
    });
  };

  const stopPlaylist = () => {
    setIsPlaying(false);
    setCurrentPlaylist(null);
    setCurrentTrackIndex(0);
    setCurrentTime(0);
    setDuration(0);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const nextTrack = () => {
    if (!currentPlaylist) return;
    
    const nextIndex = (currentTrackIndex + 1) % (currentPlaylist?.audioFiles.length || 0);
    setCurrentTrackIndex(nextIndex);
    setCurrentTime(0);
    
    if (isPlaying) {
      // Auto-play next track
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
        }
      }, 100);
    }
  };

  const previousTrack = () => {
    if (!currentPlaylist) return;
    
    const prevIndex = currentTrackIndex === 0 
      ? (currentPlaylist?.audioFiles.length || 0) - 1 
      : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTime(0);
    
    if (isPlaying) {
      // Auto-play previous track
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
        }
      }, 100);
    }
  };

  const togglePlayPause = () => {
    if (!currentPlaylist) return;
    
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.play();
      }
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meditation Guides</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Playlist</span>
        </Button>
      </div>

      {/* Create Playlist Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Playlist</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Playlist Name *
              </label>
              <input
                type="text"
                value={newPlaylist.name}
                onChange={(e) => setNewPlaylist(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter playlist name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={newPlaylist.description}
                onChange={(e) => setNewPlaylist(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter description"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newPlaylist.isPublic}
                onChange={(e) => setNewPlaylist(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Make playlist public</span>
            </label>
          </div>

          {/* Audio Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Audio Files
            </label>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search audio files by title, description, category, or language..."
                  value={audioSearchQuery}
                  onChange={(e) => setAudioSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {filteredAvailableAudio.length} of {availableAudio.length} audio files found
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {filteredAvailableAudio.map((audio) => (
                <label key={audio.id} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAudio.includes(audio.id)}
                    onChange={() => toggleAudioSelection(audio.id)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {audio.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {audio.category} â€¢ {audio.language}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setNewPlaylist({ name: '', description: '', isPublic: false });
                setSelectedAudio([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={createPlaylist}>
              Create Playlist
            </Button>
          </div>
        </div>
      )}
      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No playlists yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Create your first playlist to organize your favorite meditation audio
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Your First Playlist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Playlist Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {playlist.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    playlist.isPublic 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {playlist.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                
                {playlist.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {playlist.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{playlist.audioFiles.length} track{playlist.audioFiles.length !== 1 ? 's' : ''}</span>
                  <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Playlist Actions */}
              <div className="p-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => startPlaylist(playlist)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Play
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // TODO: Implement playlist editing
                      showToast({
                        type: 'info',
                        title: 'Coming Soon',
                        message: 'Playlist editing will be implemented soon!',
                        duration: 3000
                      });
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePlaylist(playlist.id)}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}








