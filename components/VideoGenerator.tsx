
import React, { useState, useEffect, useRef } from 'react';
import { blobToBase64, dataUrlToFile, deliaAvatarBase64 } from '../utils/audioUtils';
import { generateVideoFromImage } from '../services/geminiService';
import { ShareButtons } from './ShareButtons';

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const FilmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>;

interface VideoGeneratorProps {
    initialImageDataUrl: string | null;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ initialImageDataUrl }) => {
    const [isKeySelected, setIsKeySelected] = useState(false);
    const [keyCheckStatus, setKeyCheckStatus] = useState<'checking' | 'checked'>('checking');
    
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const checkApiKey = async () => {
        setKeyCheckStatus('checking');
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
        setKeyCheckStatus('checked');
    };

    useEffect(() => {
        checkApiKey();
    }, []);

    useEffect(() => {
        const loadImage = async (dataUrl: string, filename: string) => {
            try {
                const file = await dataUrlToFile(dataUrl, filename);
                setOriginalImageFile(file);
                setOriginalImageUrl(dataUrl);
                // Reset other states
                setGeneratedVideoUrl(null);
                setError(null);
                setPrompt('');
            } catch (error) {
                console.error(`Failed to load image from dataUrl:`, error);
                setError(`No se pudo cargar la imagen.`);
            }
        };

        if (initialImageDataUrl) {
            loadImage(initialImageDataUrl, "initial-frame.jpg");
        } else {
            loadImage(deliaAvatarBase64, "delia-avatar.jpg");
        }
    }, [initialImageDataUrl]);
    
    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        setIsKeySelected(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalImageFile(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setGeneratedVideoUrl(null);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!originalImageFile || !prompt) {
            setError('Por favor, sube una imagen y escribe una instrucción.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);

        try {
            const base64String = await blobToBase64(originalImageFile);
            const result = await generateVideoFromImage(
                base64String,
                originalImageFile.type,
                prompt,
                aspectRatio,
                (message) => setLoadingMessage(message)
            );
            setGeneratedVideoUrl(result.url);
            if (result.resetKey) {
                setError("La clave de API no es válida. Por favor, selecciona otra.");
                setIsKeySelected(false);
            }
        } catch (err: any) {
            console.error("Error generating video:", err);
            setError(err.message || 'Ocurrió un error al generar el video.');
            if (err.resetKey) {
                 setError("La clave de API no es válida o no fue encontrada. Por favor, selecciona una clave para usar Veo.");
                 setIsKeySelected(false);
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    if (keyCheckStatus === 'checking') {
        return <div className="w-full h-full flex items-center justify-center bg-pink-50"><p>Verificando API Key...</p></div>
    }

    if (!isKeySelected) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center bg-pink-50 p-4">
                <h2 className="text-2xl font-bold text-pink-600 mb-2">Se requiere una API Key</h2>
                <p className="max-w-md text-gray-600 mb-4">Para usar el generador de video Veo, necesitas seleccionar una API Key de tu proyecto de Google Cloud.</p>
                <button
                    onClick={handleSelectKey}
                    className="px-6 py-3 bg-pink-500 text-white font-bold rounded-full shadow-lg flex items-center space-x-2 transform transition-transform active:scale-95 hover:bg-pink-600"
                >
                    <span>Seleccionar API Key</span>
                </button>
                 <p className="text-xs text-gray-500 mt-4 max-w-md">
                    Esta función puede incurrir en costos. Consulta la <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline text-blue-500">documentación de facturación</a> para más detalles.
                </p>
                 {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-blue-50 flex flex-col p-4 overflow-auto">
             <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">Creador de Video</h2>
                <p className="text-gray-500 text-sm">Anima tus fotos con el poder de Veo</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                {/* Input Panel */}
                <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col">
                    <div 
                        className="flex-grow border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center p-4 cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {originalImageUrl ? (
                            <img src={originalImageUrl} alt="Original" className="max-h-full max-w-full object-contain rounded-md" />
                        ) : (
                            <div>
                                <UploadIcon />
                                <p className="mt-2 text-sm font-semibold text-gray-600">Haz clic para subir una imagen</p>
                                <p className="text-xs text-gray-500">Esta será el fotograma inicial</p>
                            </div>
                        )}
                    </div>
                     <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué quieres que pase en el video?</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={!originalImageFile}
                            placeholder={originalImageFile ? "Ej: 'un holograma de neón de un gato conduciendo a toda velocidad'" : "Sube una imagen primero"}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                            rows={3}
                        />
                    </div>
                    <div className="mt-4">
                         <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                         <div className="flex space-x-2">
                             <button onClick={() => setAspectRatio('9:16')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${aspectRatio === '9:16' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Vertical (9:16)</button>
                             <button onClick={() => setAspectRatio('16:9')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${aspectRatio === '16:9' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Horizontal (16:9)</button>
                         </div>
                    </div>
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading || !originalImageFile || !prompt}
                        className="mt-4 w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center space-x-2 transform transition-transform active:scale-95 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {isLoading ? (
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <FilmIcon />
                        )}
                        <span>{isLoading ? 'Generando...' : 'Generar Video'}</span>
                    </button>
                     {error && !error.includes("API") && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                </div>
                {/* Output Panel */}
                 <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center">
                      {isLoading && (
                        <div className="text-center text-blue-900">
                             <div className="relative h-16 w-16 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse"></div>
                                <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-pink-500 animate-spin" style={{ animationDuration: '1.2s' }}></div>
                            </div>
                            <p className="font-semibold animate-pulse">{loadingMessage}</p>
                            <p className="text-sm text-gray-500 mt-2">La generación de video puede tardar varios minutos.</p>
                        </div>
                    )}
                     {!isLoading && generatedVideoUrl && (
                         <div className="w-full h-full flex flex-col items-center justify-between">
                            <video 
                                ref={videoRef} 
                                key={generatedVideoUrl} 
                                src={generatedVideoUrl} 
                                controls 
                                autoPlay 
                                loop
                                className="w-full max-h-[80%] object-contain rounded-md"
                            ></video>
                            <div className="w-full mt-4 pt-4 border-t border-gray-200">
                                <ShareButtons />
                            </div>
                        </div>
                     )}
                     {!isLoading && !generatedVideoUrl && (
                         <div className="text-center text-gray-400">
                             <FilmIcon />
                             <p className="mt-2 text-sm font-semibold">Tu video generado aparecerá aquí</p>
                         </div>
                     )}
                 </div>
            </div>
        </div>
    );
};