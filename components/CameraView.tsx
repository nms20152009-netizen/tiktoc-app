
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeScene } from '../services/geminiService';
import { blobToBase64 } from '../utils/audioUtils';
import { SuggestionsOverlay } from './SuggestionsOverlay';
import { MusicLibrary } from './MusicLibrary';
import { type Track } from '../data/music';
import { ShareButtons } from './ShareButtons';

type Platform = 'tiktok' | 'facebook' | 'otra';
interface Filter {
    name: string;
    css: string;
}

interface CameraViewProps {
    onNavigateToGenerator: (imageDataUrl: string) => void;
}

const AR_FILTERS: Filter[] = [
    { name: 'Normal', css: 'none' },
    { name: 'Retro', css: 'sepia(0.6) contrast(1.1) brightness(0.9) saturate(1.2)' },
    { name: 'Vívido', css: 'saturate(1.8) contrast(1.2)' },
    { name: 'B&N', css: 'grayscale(1)' },
    { name: 'Cool', css: 'contrast(1.1) brightness(1.1) hue-rotate(-15deg)' },
    { name: 'Cálido', css: 'sepia(0.2) saturate(1.4) hue-rotate(10deg)' },
];

// FIX: Define platformOptions to resolve 'Cannot find name' error.
const platformOptions: { id: Platform; label: string }[] = [
    { id: 'tiktok', label: 'TikTok' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'otra', label: 'Otra' }
];

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

export const CameraView: React.FC<CameraViewProps> = ({ onNavigateToGenerator }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const musicAudioRef = useRef<HTMLAudioElement>(null);

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [platform, setPlatform] = useState<Platform>('tiktok');
    const [isRecording, setIsRecording] = useState(false);
    const [activeFilter, setActiveFilter] = useState<Filter>(AR_FILTERS[0]);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

    // State for music feature
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [musicVolume, setMusicVolume] = useState(0.7);
    const [isMusicLibraryOpen, setIsMusicLibraryOpen] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("No se pudo acceder a la cámara. Revisa los permisos en tu navegador.");
        }
    }, []);

    useEffect(() => {
        if (!recordedVideoUrl) {
            startCamera();
        }
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera, recordedVideoUrl]);

    // Effect to sync video and music playback
    useEffect(() => {
        const video = videoPreviewRef.current;
        const audio = musicAudioRef.current;

        if (!video || !audio || !selectedTrack) return;

        const syncPlay = () => audio.play();
        const syncPause = () => audio.pause();
        const syncTime = () => {
            if (Math.abs(video.currentTime - audio.currentTime) > 0.5) {
                audio.currentTime = video.currentTime;
            }
        };

        video.addEventListener('play', syncPlay);
        video.addEventListener('pause', syncPause);
        video.addEventListener('seeking', syncTime);

        // Initial sync
        audio.currentTime = video.currentTime;
        if (!video.paused) {
            audio.play().catch(console.error);
        }

        return () => {
            video.removeEventListener('play', syncPlay);
            video.removeEventListener('pause', syncPause);
            video.removeEventListener('seeking', syncTime);
            audio.pause();
        };
    }, [selectedTrack]);

    // Effect to control music volume
    useEffect(() => {
        if (musicAudioRef.current) {
            musicAudioRef.current.volume = musicVolume;
        }
    }, [musicVolume]);


    const handleAnalyzeScene = async () => {
        if (!videoRef.current || !canvasRef.current || isRecording) return;
        setIsLoading(true);
        setSuggestions([]);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            setIsLoading(false);
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    // FIX: Removed unnecessary `as File` cast, as `blobToBase64` now accepts `Blob`.
                    const base64String = await blobToBase64(blob);
                    const result = await analyzeScene(base64String);
                    setSuggestions(result);
                } catch (err) {
                     setSuggestions(["Hubo un error al procesar la imagen."]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
                setSuggestions(["No se pudo capturar la imagen."]);
            }
        }, 'image/jpeg', 0.9);
    };

    const startRecording = useCallback(() => {
        if (!videoRef.current?.srcObject) return;
        setIsRecording(true);
        recordedChunksRef.current = [];
        const stream = videoRef.current.srcObject as MediaStream;
        mediaRecorderRef.current = new MediaRecorder(stream);
    
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };
    
        mediaRecorderRef.current.onstop = () => {
            const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(videoBlob);
            setRecordedVideoUrl(videoUrl);
        };
    
        mediaRecorderRef.current.start();
    }, []);

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleStartRecording = () => {
        if (isRecording || isLoading) return;
        startRecording();
    };
    
    const handleGenerateVideoFromFrame = () => {
        const video = videoPreviewRef.current;
        if (!video || !onNavigateToGenerator) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onNavigateToGenerator(dataUrl);
        } else {
            setError("No se pudo procesar el fotograma del video.");
        }
    };

    const handleRetake = () => {
        setRecordedVideoUrl(null);
        setSelectedTrack(null);
        setIsMusicLibraryOpen(false);
    };

    const handleSaveVideo = async () => {
        if (!recordedVideoUrl) return;
        try {
            const response = await fetch(recordedVideoUrl);
            const videoBlob = await response.blob();
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            const url = window.URL.createObjectURL(videoBlob);
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.download = `TikFsceS-video-${timestamp}.webm`;
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("Error saving video:", error);
            setError("No se pudo guardar el video. Inténtalo de nuevo.");
        }
    };


    if (recordedVideoUrl) {
        return (
            <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
                {isMusicLibraryOpen && (
                    <MusicLibrary
                        onSelectTrack={(track) => {
                            setSelectedTrack(track);
                            setIsMusicLibraryOpen(false);
                        }}
                        onClose={() => setIsMusicLibraryOpen(false)}
                    />
                )}
                <video ref={videoPreviewRef} src={recordedVideoUrl} controls autoPlay loop className="w-full h-auto max-h-[75%] object-contain" />
                <audio ref={musicAudioRef} src={selectedTrack?.url} loop />

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center space-y-3">
                    {selectedTrack ? (
                        <div className="w-full max-w-sm bg-black/50 backdrop-blur-md rounded-xl p-3 text-white space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">{selectedTrack.title}</p>
                                    <p className="text-xs text-gray-300">{selectedTrack.artist}</p>
                                </div>
                                <button onClick={() => setIsMusicLibraryOpen(true)} className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">Cambiar</button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm">🔊</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={musicVolume}
                                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-pink-500"
                                />
                            </div>
                        </div>
                    ) : (
                         <button
                            onClick={() => setIsMusicLibraryOpen(true)}
                            className="px-6 py-2 bg-white/20 backdrop-blur-md text-white font-semibold rounded-full shadow-lg flex items-center space-x-2 transform transition-transform active:scale-95"
                        >
                            <span className="text-xl">🎵</span>
                            <span>Añadir Música</span>
                        </button>
                    )}
                    
                    <div className="flex items-center justify-center flex-wrap gap-4">
                        <button
                            onClick={handleGenerateVideoFromFrame}
                            className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-blue-500 text-white font-bold rounded-full shadow-lg flex items-center space-x-2 transform transition-transform active:scale-95 hover:shadow-xl"
                        >
                             <span className="text-lg">🎬</span>
                             <span className="text-sm">Generar con IA</span>
                        </button>
                         <button 
                            onClick={handleRetake}
                            className="px-5 py-2.5 bg-white/20 backdrop-blur-md text-white font-semibold rounded-full shadow-lg transform transition-transform active:scale-95"
                        >
                            Grabar de Nuevo
                        </button>
                        <button
                            onClick={handleSaveVideo}
                            className="px-5 py-2.5 bg-white/20 backdrop-blur-md text-white font-semibold rounded-full shadow-lg transform transition-transform active:scale-95 flex items-center space-x-2"
                        >
                           <DownloadIcon />
                           <span>Guardar</span>
                        </button>
                    </div>
                    <div className="w-full max-w-sm pt-3 mt-2 border-t border-white/20">
                        <ShareButtons />
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
            {error ? (
                <div className="p-4 bg-red-100 text-red-800 rounded-lg m-4">{error}</div>
            ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transition-all duration-500"
                    style={{ filter: activeFilter.css }}
                ></video>
            )}

            <SuggestionsOverlay suggestions={suggestions} isLoading={isLoading} onClear={() => setSuggestions([])} />

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-end z-10 space-y-4">
                 {!isRecording && (
                    <div className="w-full max-w-lg overflow-x-auto pb-2">
                        <div className="flex space-x-2 bg-black/30 backdrop-blur-sm p-1 rounded-full w-max mx-auto">
                            {AR_FILTERS.map(filter => (
                                <button 
                                    key={filter.name}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${activeFilter.name === filter.name ? 'bg-pink-500 text-white' : 'text-white/80 hover:bg-white/20'}`}
                                >
                                    {filter.name}
                                </button>
                            ))}
                        </div>
                    </div>
                 )}

                <div className="flex items-center justify-center w-full" style={{minHeight: '80px'}}>
                    <div className="w-full flex justify-center items-center space-x-16">
                        <button
                            onClick={handleAnalyzeScene}
                            disabled={isLoading || isRecording}
                            aria-label="Analizar Escena"
                            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                             <span className="text-3xl transition-transform group-hover:scale-110">✨</span>
                        </button>

                        <button
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            disabled={isLoading}
                            aria-label={isRecording ? "Detener Grabación" : "Iniciar Grabación"}
                            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRecording ? (
                                <div className="w-8 h-8 bg-pink-500 rounded-md animate-pulse"></div>
                            ) : (
                                <div className="p-1 bg-pink-300 rounded-full">
                                    <div className="w-full h-full bg-pink-500 rounded-full border-4 border-white"></div>
                                </div>
                            )}
                        </button>
                        
                         <div className="w-16 h-16 flex items-center justify-center">
                            {!isRecording && (
                                <div className="flex flex-col items-center space-y-1 bg-black/30 backdrop-blur-sm p-2 rounded-xl">
                                    {platformOptions.map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setPlatform(opt.id)}
                                            className={`w-10 h-6 text-[10px] font-bold rounded-md transition-colors ${platform === opt.id ? 'bg-blue-500 text-white' : 'text-white/70 bg-white/10'}`}
                                        >
                                            {opt.label.substring(0,4)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};
