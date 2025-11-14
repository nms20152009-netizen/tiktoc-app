import React, { useState, useRef, useEffect, useCallback } from 'react';
import { connectToGemilive } from '../services/geminiService';
import { decode, decodeAudioData, createBlob, deliaAvatarBase64 } from '../utils/audioUtils';
import { Transcript } from '../types';
import type { LiveServerMessage, LiveSession } from '@google/genai';

// Icon components for UI clarity
const MicOnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a2 2 0 0 0 2-2V6a2 2 0 1 0-4 0v6a2 2 0 0 0 2 2zm-2-6a2 2 0 0 1 4 0v6a2 2 0 0 1-4 0V6z"/><path d="M12 18.5c-3.28 0-6-2.46-6-5.5V9.91a.5.5 0 0 1 1 0v3.09c0 2.48 2.24 4.5 5 4.5s5-2.02 5-4.5V9.91a.5.5 0 0 1 1 0v3.09c0 3.04-2.72 5.5-6 5.5z"/><path d="M12 21a1 1 0 0 1-1-1v-2.06c-3.31-.25-6-2.7-6-5.44V10a1 1 0 1 1 2 0v2.5c0 2.21 1.79 4 4 4s4-1.79 4-4V10a1 1 0 1 1 2 0v2.5c0 2.74-2.69 5.19-6 5.44V20a1 1 0 0 1-1 1z"/></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>;

export const GemiliveAssistant: React.FC = () => {
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTime = useRef(0);

    const scrollToBottom = () => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [transcripts]);
    
    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            currentOutputTranscription.current += message.serverContent.outputTranscription.text;
        }
        if (message.serverContent?.inputTranscription) {
            currentInputTranscription.current += message.serverContent.inputTranscription.text;
        }

        if (message.serverContent?.turnComplete) {
            const finalInput = currentInputTranscription.current.trim();
            const finalOutput = currentOutputTranscription.current.trim();
            
            setTranscripts(prev => {
                const newTranscripts = [...prev];
                if (finalInput) newTranscripts.push({ speaker: 'user', text: finalInput });
                if (finalOutput) newTranscripts.push({ speaker: 'gemini', text: finalOutput });
                return newTranscripts;
            });

            currentInputTranscription.current = '';
            currentOutputTranscription.current = '';
        }

        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current && outputNodeRef.current) {
            const outputAudioContext = outputAudioContextRef.current;
            nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNodeRef.current);
            source.addEventListener('ended', () => audioSources.current.delete(source));
            source.start(nextStartTime.current);
            nextStartTime.current += audioBuffer.duration;
            audioSources.current.add(source);
        }
        
        if (message.serverContent?.interrupted) {
            audioSources.current.forEach(source => source.stop());
            audioSources.current.clear();
            nextStartTime.current = 0;
        }

    }, []);

    const stopSession = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then((session) => session.close());
            sessionPromiseRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        audioSources.current.clear();
        setStatus('idle');
    }, []);

    const startSession = useCallback(async () => {
        setStatus('connecting');
        setTranscripts([]);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputNodeRef.current = outputAudioContextRef.current.createGain();
            outputNodeRef.current.connect(outputAudioContextRef.current.destination);

            const callbacks = {
                onopen: () => {
                    setStatus('listening');
                    const source = audioContextRef.current!.createMediaStreamSource(stream);
                    const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    processorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if(sessionPromiseRef.current) {
                           sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                           });
                        }
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(audioContextRef.current!.destination);
                },
                onmessage: handleMessage,
                onerror: (e: ErrorEvent) => {
                    console.error('Live API Error:', e);
                    setError('Ocurrió un error en la conexión.');
                    setStatus('error');
                    stopSession();
                },
                onclose: (e: CloseEvent) => {
                    // Only set to idle if not already manually stopped or in an error state
                    setStatus(prev => (prev === 'listening' || prev === 'connecting' ? 'idle' : prev));
                },
            };
            sessionPromiseRef.current = connectToGemilive(callbacks);
        } catch (err) {
            console.error('Failed to start session:', err);
            setError('No se pudo acceder al micrófono. Revisa los permisos.');
            setStatus('error');
        }
    }, [handleMessage, stopSession]);
    
    useEffect(() => {
        return () => {
            stopSession();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="w-full h-full bg-blue-50 flex flex-col p-4">
            <div className="flex-grow bg-white rounded-2xl shadow-inner p-4 overflow-y-auto mb-4 space-y-4">
                {transcripts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <img src={deliaAvatarBase64} alt="Delia Avatar" className="w-24 h-24 rounded-full object-cover mb-4 shadow-lg border-4 border-white"/>
                        <p className="mt-2 font-semibold text-lg">Presiona "Iniciar" para conversar con Delia.</p>
                        <p className="text-sm mt-1">Tu asistente personal de creación de contenido.</p>
                    </div>
                )}
                {transcripts.map((t, i) => (
                    <div key={i} className={`flex items-start gap-2.5 ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {t.speaker === 'gemini' && (
                           <img src={deliaAvatarBase64} alt="Delia Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
                        )}
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${t.speaker === 'user' ? 'bg-pink-200 text-pink-900 rounded-br-none' : 'bg-blue-200 text-blue-900 rounded-bl-none'}`}>
                            <p className="text-sm">{t.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={transcriptEndRef} />
            </div>
            
            <div className="flex-shrink-0 flex flex-col items-center">
                {error && <p className="text-red-600 mb-2">{error}</p>}
                {status === 'idle' || status === 'error' ? (
                     <button onClick={startSession} className="px-6 py-3 bg-pink-500 text-white font-bold rounded-full shadow-lg flex items-center space-x-2 transform transition-transform active:scale-95 hover:bg-pink-600">
                        <MicOnIcon />
                        <span>Iniciar Conversación</span>
                    </button>
                ) : (
                     <button onClick={stopSession} className="px-6 py-3 bg-gray-500 text-white font-bold rounded-full shadow-lg flex items-center space-x-2 transform transition-transform active:scale-95 hover:bg-gray-600">
                        <StopIcon />
                        <span>Detener</span>
                    </button>
                )}
                <div className="mt-2 text-sm text-gray-500 h-6 flex items-center">
                    {status === 'connecting' && <p className="animate-pulse">Conectando con Gemilive...</p>}
                    {status === 'listening' && <p className="text-green-600 font-semibold flex items-center"><span className="relative flex h-3 w-3 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>Escuchando...</p>}
                </div>
            </div>
        </div>
    );
};