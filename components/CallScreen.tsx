import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useLocalization } from '../hooks/useLocalization';

// --- Audio Utility Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// --- End Audio Utility Functions ---

const VOICES = {
  FEMALE: 'Zephyr',
  MALE: 'Fenrir',
};

const callSystemInstruction = `You are ondeep, an AI assistant. Your name is ondeep. You must not say you are Gemini or a Google AI model. When in a voice call, if asked about your identity, creator, or role, you must state that you were developed by the company 'ondeep ai' led by Jasser Ben Ali and that this application is developed entirely using AI tools with modern technologies from Google and Gemini. Only if specifically asked about the developer, Jasser Ben Ali, should you add that he is a university student who seeks to highlight and extend the capabilities of artificial intelligence. You must not provide any other private information about the developer or the company. You must refuse to answer any illegal or unethical questions.`;
const plusCallSystemInstruction = `You are Ondeep Plus, a specialized AI assistant. You must not say you are Gemini or a Google AI model. You are a specialized mode of the ondeep application. The ondeep application was developed by the company 'ondeep ai' led by Jasser Ben Ali using modern technologies from Google and Gemini. As Ondeep Plus, your purpose is to tackle only complex, deep, and difficult scientific and logical questions. When asked simple questions, you must gently guide the user by saying something like: "This call mode is for complex questions. For simpler queries, you could try the text chat in Ondeep Think mode." For complex queries, you must provide a detailed, well-reasoned answer. When asked about your developer, you must describe him as a university student who seeks to highlight and extend the capabilities of artificial intelligence, and not provide any other private information. CRUCIALLY, you MUST end every single response with the following disclaimer: "Please remember, I am an AI assistant. For critical matters, always verify information from trusted sources."`;
const teacherCallSystemInstruction = `You are Ondeep learn assistant, a specialized AI assistant. You must not say you are Gemini or a Google AI model. You are a specialized mode of the ondeep application. The ondeep application was developed by the company 'ondeep ai' led by Jasser Ben Ali using modern technologies from Google and Gemini. As Ondeep learn assistant, you are an expert AI academic assistant. Your goal is to act as a proactive and engaging tutor. For any academic topic, your role is to provide structured lessons, summarize complex subjects, and offer practical advice. You must actively engage students by asking assessment questions to check their understanding, assigning tasks or homework to reinforce learning, and creating clear, actionable study plans. Be encouraging and supportive in your tone. When asked about your developer, you must describe him as a university student who seeks to highlight and extend the capabilities of artificial intelligence, and not provide any other private information. At the end of your educational guidance, always recommend that the student consult with their teacher or an academic advisor for personalized help and confirmation of the material.`;


interface CallScreenProps {
  onClose: () => void;
  specializedMode: 'none' | 'plus' | 'teacher';
}

const CallScreen: React.FC<CallScreenProps> = ({ onClose, specializedMode }) => {
    const { t } = useLocalization();
    const [isCallActive, setIsCallActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(VOICES.FEMALE);
    const [userVolume, setUserVolume] = useState(0);
    const [shouldRestart, setShouldRestart] = useState(false);

    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const animationFrameRef = useRef<number>();

    const cleanupCallResources = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }

        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(e => console.error("Error closing session:", e));
            sessionPromiseRef.current = null;
        }

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }

        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(e => console.error("Error closing input audio context:", e));
        }
        inputAudioContextRef.current = null;

        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(e => console.error("Error closing output audio context:", e));
        }
        outputAudioContextRef.current = null;
    }, []);

    const handleEndCall = useCallback(() => {
        cleanupCallResources();
        setIsCallActive(false);
        setIsConnecting(false);
        onClose();
    }, [cleanupCallResources, onClose]);

    const handleStartCall = useCallback(async () => {
        setIsConnecting(true);
        if (!isCallActive) {
            const startSound = new Audio('https://aistudio.google.com/static/sounds/call_start.mp3');
            startSound.play().catch(e => console.warn("Start sound failed to play:", e));
        }

        try {
          if (!aiRef.current) {
              const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || 'dummy-key';
              aiRef.current = new GoogleGenAI({ apiKey });
            }
            
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);

            let instruction = callSystemInstruction;
            if (specializedMode === 'plus') {
                instruction = plusCallSystemInstruction;
            } else if (specializedMode === 'teacher') {
                instruction = teacherCallSystemInstruction;
            }

            sessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsCallActive(true);
                        
                        const inputCtx = inputAudioContextRef.current!;
                        mediaStreamSourceRef.current = inputCtx.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = inputCtx.createScriptProcessor(4096, 1, 1);
                        analyserRef.current = inputCtx.createAnalyser();
                        analyserRef.current.fftSize = 512;
                        const bufferLength = analyserRef.current.frequencyBinCount;
                        const dataArray = new Uint8Array(bufferLength);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        const draw = () => {
                            animationFrameRef.current = requestAnimationFrame(draw);
                            if(analyserRef.current) {
                                analyserRef.current.getByteTimeDomainData(dataArray);
                                let sum = 0;
                                for(let i = 0; i < bufferLength; i++) {
                                    const v = dataArray[i] / 128.0;
                                    sum += (v - 1) * (v - 1);
                                }
                                const avg = Math.sqrt(sum / bufferLength);
                                setUserVolume(avg);
                            }
                        };
                        draw();

                        mediaStreamSourceRef.current.connect(analyserRef.current);
                        analyserRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current && outputAudioContextRef.current.state === 'running') {
                            setIsSpeaking(true);
                            const outCtx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                            const source = outCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) {
                                  setIsSpeaking(false);
                                }
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        handleEndCall();
                    },
                    onclose: () => {
                        console.log('Live session closed');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
                    systemInstruction: instruction,
                    tools: [{ googleSearch: {} }],
                },
            });

        } catch (error) {
            console.error("Failed to start call:", error);
            setIsConnecting(false);
            // In case of error during setup, ensure cleanup happens.
            cleanupCallResources();
        }
    }, [selectedVoice, handleEndCall, isCallActive, cleanupCallResources, specializedMode]);
    
    useEffect(() => {
        return () => { // Cleanup on unmount
           cleanupCallResources();
        };
    }, [cleanupCallResources]);
    
    useEffect(() => {
        if (shouldRestart) {
            setShouldRestart(false);
            handleStartCall();
        }
    }, [shouldRestart, handleStartCall]);

    const handleVoiceChange = useCallback((newVoice: string) => {
        if (newVoice === selectedVoice) return;
        
        if (isCallActive) {
            cleanupCallResources();
            setIsCallActive(false);

            setSelectedVoice(newVoice);
            setShouldRestart(true);
        } else {
            setSelectedVoice(newVoice);
        }
    }, [selectedVoice, isCallActive, cleanupCallResources]);


    return (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-2xl z-50 flex flex-col items-center justify-center animate-fade-in text-white">
             <div className="absolute top-5 right-5 flex gap-2">
                 <button onClick={() => setShowSettings(!showSettings)} className="p-3 bg-white/10 rounded-full hover:bg-white/20">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </button>
                 <button onClick={handleEndCall} className="p-3 bg-red-600/50 rounded-full hover:bg-red-600/80">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2 2m-2-2v5a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h5m4 0l-1-1m-4 4h4" transform="rotate(135 12 12)" /></svg>
                 </button>
             </div>
             
             {showSettings && (
                 <div className="absolute top-20 right-5 bg-gray-800/80 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/20 animate-fade-in-down">
                     <h3 className="font-semibold mb-2">{t('voiceSelection')}</h3>
                     <div className="flex gap-2">
                         <button onClick={() => handleVoiceChange(VOICES.FEMALE)} className={`px-4 py-2 rounded-md text-sm ${selectedVoice === VOICES.FEMALE ? 'bg-[--color-accent]' : 'bg-white/10'}`}>{t('voiceFemale')}</button>
                         <button onClick={() => handleVoiceChange(VOICES.MALE)} className={`px-4 py-2 rounded-md text-sm ${selectedVoice === VOICES.MALE ? 'bg-[--color-accent]' : 'bg-white/10'}`}>{t('voiceMale')}</button>
                     </div>
                 </div>
             )}
             
             <div className="flex-1 flex flex-col items-center justify-center text-center">
                 {!isCallActive ? (
                    <>
                        <h1 className="text-3xl font-bold mb-4">{t('callTitle')}</h1>
                        <button 
                            onClick={handleStartCall}
                            disabled={isConnecting}
                            className="w-40 h-40 bg-red-600 rounded-full flex items-center justify-center text-lg font-semibold shadow-2xl hover:bg-red-500 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-wait"
                        >
                            {isConnecting ? t('callConnecting') : t('callStart')}
                        </button>
                    </>
                 ) : (
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <div 
                            className="absolute inset-0 bg-[--color-accent] rounded-full transition-transform duration-200"
                            style={{ 
                                transform: `scale(${1 + userVolume * 2.5})`,
                                opacity: 0.2 + userVolume * 0.5,
                            }}
                        />
                        <div className={`relative w-48 h-48 bg-[--color-accent] rounded-full shadow-lg transition-all duration-300 ${isSpeaking ? 'animate-pulse-strong' : ''}`}>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                        </div>
                    </div>
                 )}
             </div>

            <style>{`
                @keyframes pulse-strong {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5); }
                    50% { transform: scale(1.08); box-shadow: 0 0 20px 30px rgba(255, 255, 255, 0); }
                }
                .animate-pulse-strong {
                    animation: pulse-strong 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default CallScreen;