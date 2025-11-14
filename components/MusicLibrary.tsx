
import React, { useState, useRef, useEffect } from 'react';
import { MUSIC_LIBRARY, Track } from '../data/music';

// Icons
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

interface MusicLibraryProps {
    onSelectTrack: (track: Track) => void;
    onClose: () => void;
}

export const MusicLibrary: React.FC<MusicLibraryProps> = ({ onSelectTrack, onClose }) => {
    const [previewingTrackId, setPreviewingTrackId] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePreview = (track: Track) => {
        if (previewingTrackId === track.id) {
            // Pause current track
            audioRef.current?.pause();
            setPreviewingTrackId(null);
        } else {
            // Play new track
            if (audioRef.current) {
                audioRef.current.src = track.url;
                audioRef.current.play().catch(console.error);
            }
            setPreviewingTrackId(track.id);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => setPreviewingTrackId(null);
        audio?.addEventListener('ended', handleEnded);
        
        // Cleanup function to stop audio when the component unmounts
        return () => {
            if (audio) {
                audio.pause();
                audio.removeEventListener('ended', handleEnded);
            }
        };
    }, []);

    const handleSelect = (track: Track) => {
        onSelectTrack(track);
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-800">Añadir Música</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon /></button>
                </header>
                <div className="overflow-y-auto p-2">
                    {MUSIC_LIBRARY.map(track => (
                        <div key={track.id} className="flex items-center space-x-4 p-3 hover:bg-gray-100 rounded-lg">
                            <button onClick={() => togglePreview(track)} className="text-pink-500">
                                {previewingTrackId === track.id ? <PauseIcon /> : <PlayIcon />}
                            </button>
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-800">{track.title}</p>
                                <p className="text-sm text-gray-500">{track.artist}</p>
                            </div>
                            <button 
                                onClick={() => handleSelect(track)}
                                className="px-4 py-1.5 bg-pink-500 text-white text-sm font-semibold rounded-full hover:bg-pink-600 transition-colors"
                            >
                                Añadir
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <audio ref={audioRef} />
        </div>
    );
};
