
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { LiveSession, LiveCallbacks } from '@google/genai';

// This check is to prevent vite from trying to access process.env at build time
const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
if (!apiKey) {
    // A simple check, though the prompt guarantees it will be available at runtime.
    console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

// Model Names
const visionModel = 'gemini-2.5-pro';
const liveModel = 'gemini-2.5-flash-native-audio-preview-09-2025';
const imageEditModel = 'gemini-2.5-flash-image';
const videoGenModel = 'veo-3.1-fast-generate-preview';


// Function to analyze a scene from an image
export const analyzeScene = async (base64ImageData: string): Promise<string[]> => {
  try {
    const prompt = `
    Eres Gemilive, un asistente de creación de contenido proactivo para la app TikFsceS.
    Analiza la siguiente imagen de la cámara de un usuario que se prepara para grabar un video.
    Proporciona 3 sugerencias cortas y accionables en tiempo real para mejorar su contenido.
    Las sugerencias deben clasificarse en estas categorías: composición, tendencias y engagement.

    Ejemplos de directivas:
    - "Sugerencia de composición: ajusta la iluminación a tu izquierda para mejorar el contraste."
    - "Análisis de tendencias: un audio popular ahora es 'Sonido Viral X'. Considera usarlo para un video de 20-30 segundos."
    - "Recomendación de engagement: ¡sonríe en los primeros 3 segundos! Atrapa la atención de tu audiencia."

    Basado en la imagen, genera tus propias sugerencias originales y útiles.
    Devuelve las sugerencias como un array JSON de strings. Por ejemplo: ["sugerencia 1", "sugerencia 2", "sugerencia 3"]
    `;

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64ImageData,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: visionModel,
      contents: { parts: [imagePart, textPart] },
       config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonString = response.text.trim();
    const suggestions = JSON.parse(jsonString);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error("Error analyzing scene:", error);
    return ["Hubo un error al analizar la escena. Inténtalo de nuevo."];
  }
};


// Function to connect to the Live API
export const connectToGemilive = async (callbacks: LiveCallbacks): Promise<LiveSession> => {
  const aiForLive = new GoogleGenAI({ apiKey: apiKey! });
  return aiForLive.live.connect({
    model: liveModel,
    callbacks: callbacks,
    config: {
        // FIX: Use Modality.AUDIO enum for type safety and consistency.
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `Eres Gemilive, un asistente de creación amigable y servicial para la app TikFsceS. Tu nombre es Delia. Conversa con el usuario de manera natural y dale consejos sobre creación de contenido. Sé breve y amigable.`,
    },
  });
};


// Function to edit an image with a text prompt
export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const imagePart = {
        inlineData: { data: base64ImageData, mimeType }
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: imageEditModel,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
        return part.inlineData.data;
    }
    throw new Error("No se encontró una imagen en la respuesta de la API.");
};

// Function to generate a video from an image and prompt
export const generateVideoFromImage = async (
    base64ImageData: string,
    mimeType: string,
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    onProgress: (message: string) => void
): Promise<{ url: string; resetKey: boolean }> => {
    onProgress("Iniciando la generación de video...");
    // Create a new instance to ensure it uses the most up-to-date API key
    const aiForVideo = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    try {
        let operation = await aiForVideo.models.generateVideos({
            model: videoGenModel,
            prompt: prompt,
            image: { imageBytes: base64ImageData, mimeType: mimeType },
            config: {
                numberOfVideos: 1,
                resolution: '720p', // Using 720p for faster generation
                aspectRatio: aspectRatio,
            }
        });

        const progressMessages = ["Preparando la escena...", "Aplicando magia de IA...", "Renderizando fotogramas...", "Casi listo..."];
        let messageIndex = 0;

        while (!operation.done) {
            onProgress(progressMessages[messageIndex % progressMessages.length]);
            messageIndex++;
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await aiForVideo.operations.getVideosOperation({ operation: operation });
        }
        
        if (operation.error) {
           throw new Error(operation.error.message || "Error desconocido en la operación de video.");
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("No se pudo obtener el enlace de descarga del video.");
        }

        onProgress("Descargando video...");
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY!}`);
        if (!videoResponse.ok) {
            throw new Error(`Error al descargar el video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        return { url: URL.createObjectURL(videoBlob), resetKey: false };

    } catch (error: any) {
        let resetKey = false;
        if (error.message && error.message.includes("Requested entity was not found.")) {
            resetKey = true;
        }
        // Re-throw the error to be caught by the component
        throw { ...error, resetKey };
    }
};
