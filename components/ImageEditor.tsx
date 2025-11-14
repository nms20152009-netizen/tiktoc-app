import React, { useState, useRef, useEffect } from 'react';
import { blobToBase64, dataUrlToFile, deliaAvatarBase64 } from '../utils/audioUtils';
import { editImage } from '../services/geminiService';

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h1V3a1 1 0 011-1zm-1 6a1 1 0 011-1h1v1a1 1 0 11-2 0h1V8a1 1 0 01-1-1zm1 8a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" /></svg>;

interface ImageEditorProps {
    onNavigateToGenerator: (imageDataUrl: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ onNavigateToGenerator }) => {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const setInitialImage = async () => {
            try {
                const initialFile = await dataUrlToFile(deliaAvatarBase64, 'delia-avatar.jpg');
                setOriginalImageFile(initialFile);
                setOriginalImageUrl(deliaAvatarBase64);
            } catch (error) {
                console.error("Failed to load initial image:", error);
                setError("No se pudo cargar la imagen inicial.");
            }
        };
        setInitialImage();
    }, []);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalImageFile(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setEditedImageUrl(null);
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
        setEditedImageUrl(null);

        try {
            const base64String = await blobToBase64(originalImageFile);
            const editedImageBase64 = await editImage(base64String, originalImageFile.type, prompt);
            setEditedImageUrl(`data:image/png;base64,${editedImageBase64}`);
        } catch (err: any) {
            console.error("Error editing image:", err);
            setError(err.message || 'Ocurrió un error al editar la imagen.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full bg-pink-50 flex flex-col p-4 overflow-auto">
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">Editor Mágico</h2>
                <p className="text-gray-500 text-sm">Edita tus fotos con el poder de la IA</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                {/* Input Panel */}
                <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col">
                    <div 
                        className="flex-grow border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center p-4 cursor-pointer hover:border-pink-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {originalImageUrl ? (
                            <img src={originalImageUrl} alt="Original" className="max-h-full max-w-full object-contain rounded-md" />
                        ) : (
                            <div>
                                <UploadIcon />
                                <p className="mt-2 text-sm font-semibold text-gray-600">Haz clic para subir una imagen</p>
                                <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                            </div>
                        )}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    
                    <div className="mt-4">
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">¿Qué quieres cambiar?</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={!originalImageFile}
                            placeholder={originalImageFile ? "Ej: 'añade un filtro retro' o 'quita a la persona del fondo'" : "Sube una imagen primero"}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 transition disabled:bg-gray-100"
                            rows={3}
                        />
                    </div>
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading || !originalImageFile || !prompt}
                        className="mt-4 w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center space-x-2 transform transition-transform active:scale-95 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <SparklesIcon />
                        )}
                        <span>{isLoading ? 'Generando...' : 'Generar Magia'}</span>
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                </div>

                {/* Output Panel */}
                <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center">
                    {isLoading && (
                        <div className="text-center text-blue-900">
                             <div className="relative h-16 w-16 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse"></div>
                                <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-pink-500 animate-spin" style={{ animationDuration: '1.2s' }}></div>
                            </div>
                            <p className="font-semibold">Aplicando la magia...</p>
                            <p className="text-sm text-gray-500">Esto puede tardar un momento.</p>
                        </div>
                    )}
                    {!isLoading && editedImageUrl && (
                        <div className="w-full h-full flex flex-col items-center justify-between">
                            <img src={editedImageUrl} alt="Editada" className="max-h-[80%] max-w-full object-contain rounded-md" />
                            <div className="w-full mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => onNavigateToGenerator(editedImageUrl)}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white font-bold rounded-full shadow-lg flex items-center justify-center space-x-2 transform transition-transform active:scale-95 hover:shadow-xl"
                                >
                                    <span className="text-xl">🎬</span>
                                    <span>Generar Video con IA</span>
                                </button>
                            </div>
                        </div>
                    )}
                     {!isLoading && !editedImageUrl && (
                         <div className="text-center text-gray-400">
                             <SparklesIcon />
                             <p className="mt-2 text-sm font-semibold">Tu imagen editada aparecerá aquí</p>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};