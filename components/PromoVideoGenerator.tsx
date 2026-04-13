
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { useLocalization } from '../hooks/useLocalization';

// --- Utility Functions ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

interface PromoVideoGeneratorProps {
  onClose: () => void;
}

interface Scene {
    visual_prompt: string;
    voiceover_text: string;
}

const PromoVideoGenerator: React.FC<PromoVideoGeneratorProps> = ({ onClose }) => {
    const { t } = useLocalization();
    const [hasApiKey, setHasApiKey] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ videoUrls: string[], audioUrl: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const keyStatus = await window.aistudio.hasSelectedApiKey();
                setHasApiKey(keyStatus);
            }
        };
        checkKey();
    }, []);
    
    useEffect(() => {
        if (result && isPlaying && videoRef.current) {
            videoRef.current.play().catch(e => console.error("Video play failed", e));
        }
    }, [currentVideoIndex, result, isPlaying]);


    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success and update UI immediately to avoid race conditions
            setHasApiKey(true);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setResult(null);

        try {
            // Step 1: Generate Script
            setProgressMessage(t('promoProgressScript'));
            let ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const scriptPrompt = `Generate a script for a 30-second cinematic promotional video for an AI application called 'ondeep AI'. The app features: image generation, file analysis, advanced reasoning (Ondeep Plus), fast answers (Ondeep Think), and voice calls. The script should be in Arabic. Structure the output as a JSON array of objects, where each object represents a scene and has two keys: 'visual_prompt' (a detailed, cinematic, and visually rich description for a video generation model) and 'voiceover_text' (the narration for that scene). Make the visual prompts dramatic and exciting.`;

            const scriptResponse = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: scriptPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                visual_prompt: { type: Type.STRING },
                                voiceover_text: { type: Type.STRING },
                            },
                        },
                    },
                },
            });
            const script: Scene[] = JSON.parse(scriptResponse.text);

            // Step 2: Generate Voiceover
            setProgressMessage(t('promoProgressVoiceover'));
            const fullVoiceover = script.map(s => s.voiceover_text).join(' ');
            const ttsResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: fullVoiceover }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                },
            });
            const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!audioData) throw new Error("TTS generation failed.");
            const audioBlob = new Blob([decode(audioData)], { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Step 3: Generate Video Scenes
            const videoUrls: string[] = [];
            for (let i = 0; i < script.length; i++) {
                setProgressMessage(t('promoProgressScene', { current: String(i + 1), total: String(script.length) }));
                
                // Re-initialize to get latest key, crucial for Veo
                ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

                try {
                    let operation = await ai.models.generateVideos({
                        model: 'veo-3.1-fast-generate-preview',
                        prompt: script[i].visual_prompt,
                        config: {
                            numberOfVideos: 1,
                            resolution: '720p',
                            aspectRatio: '16:9'
                        }
                    });

                    while (!operation.done) {
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        operation = await ai.operations.getVideosOperation({ operation });
                    }

                    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                    if (!downloadLink) throw new Error(`Scene ${i + 1} generation failed.`);
                    videoUrls.push(downloadLink);
                } catch(e: any) {
                    if (e.message.includes("Requested entity was not found.")) {
                       setError(t('promoVideoErrorKey'));
                       setHasApiKey(false); // Force re-selection
                       setIsGenerating(false);
                       return;
                    }
                    throw e;
                }
            }

            setProgressMessage(t('promoProgressDone'));
            setResult({ videoUrls, audioUrl });

        } catch (e: any) {
            console.error("Video generation failed:", e);
            setError(t('promoVideoError', {error: e.message}));
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlayPause = () => {
        if (!videoRef.current || !audioRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            audioRef.current.pause();
        } else {
            videoRef.current.play().catch(e => console.error("Video play failed", e));
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
        setIsPlaying(!isPlaying);
    };

    const handleVideoEnded = () => {
        if (result && currentVideoIndex < result.videoUrls.length - 1) {
            setCurrentVideoIndex(prev => prev + 1);
        } else {
            // Loop or end
            setIsPlaying(false);
            setCurrentVideoIndex(0);
            if(audioRef.current) audioRef.current.currentTime = 0;
        }
    };
    
    const renderContent = () => {
        if (!hasApiKey) {
            return (
                <div className="text-center">
                    <p className="mb-4">{t('promoVideoKeyNeeded')}</p>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-[--color-accent] hover:underline mb-4 block">
                        {t('promoVideoBillingLink')}
                    </a>
                    <button onClick={handleSelectKey} className="px-6 py-3 font-bold text-white bg-[--color-accent] rounded-xl hover:bg-[--color-accent-hover] transition-colors">
                        {t('promoVideoSelectKeyButton')}
                    </button>
                </div>
            );
        }
        if (isGenerating) {
            return (
                <div className="text-center">
                     <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[--color-accent] mx-auto mb-4"></div>
                     <p className="text-lg font-semibold">{t('promoVideoGenerating')}</p>
                     <p className="text-gray-400">{progressMessage}</p>
                </div>
            );
        }
        if (error) {
             return <p className="text-center text-red-400">{error}</p>;
        }
        if (result) {
            const videoSrc = `${result.videoUrls[currentVideoIndex]}&key=${process.env.API_KEY}`;
            return (
                <div className="w-full">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                        <video 
                            ref={videoRef}
                            key={videoSrc}
                            src={videoSrc}
                            onEnded={handleVideoEnded}
                            playsInline
                            muted
                            className="w-full h-full object-contain"
                        />
                        <audio ref={audioRef} src={result.audioUrl} onEnded={handleVideoEnded} />
                    </div>
                    <button onClick={handlePlayPause} className="w-full px-6 py-3 font-bold text-white bg-[--color-accent] rounded-xl hover:bg-[--color-accent-hover] transition-colors">
                        {isPlaying ? 'Pause' : t('promoVideoPlay')}
                    </button>
                </div>
            )
        }
        
        return (
            <div className="text-center">
                <p className="mb-4">{t('promoVideoDescription')}</p>
                <button onClick={handleGenerate} className="px-6 py-3 font-bold text-white bg-[--color-accent] rounded-xl hover:bg-[--color-accent-hover] transition-colors">
                     {t('promoVideoGenerateButton')}
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-2xl bg-[--bg-secondary-color]/80 border border-[--border-color] rounded-2xl shadow-2xl p-6 m-4 text-[--text-color] animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t('promoVideoTitle')}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {renderContent()}
            </div>
        </div>
    )
}

export default PromoVideoGenerator;
