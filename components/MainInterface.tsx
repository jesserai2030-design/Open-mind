

import React, { useState, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { runGemini } from '../services/geminiService';
import { User, Message, MessageSender, Feature, PowerMode, GroundingChunk } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import HistorySidebar from './HistorySidebar';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GenerateContentResponse } from '@google/genai';
import CallScreen from './CallScreen';
import SuperThinkIndicator from './SuperThinkIndicator';

interface MainInterfaceProps {
    onOpenSettings: () => void;
    user: User | null;
}

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"/>
        <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="8"/>
        <circle cx="67" cy="35" r="4" fill="currentColor"/>
    </svg>
);


const WelcomeMessage: React.FC<{ name: string | undefined }> = ({ name }) => {
    const { t } = useLocalization();
    const { settings } = useContext(SettingsContext);
    const isLight = settings.theme === 'light';
    
    return (
        <div className="text-center my-12 animate-fade-in-up">
            <div className={`inline-block p-4 ${isLight ? 'bg-black/5' : 'bg-white/10'} backdrop-blur-lg rounded-full shadow-lg mb-4 border ${isLight ? 'border-black/10' : 'border-white/10'}`}>
                <LogoIcon className={`w-14 h-14 ${isLight ? 'text-black' : 'text-gray-200'}`} />
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold ${isLight ? 'text-black' : 'text-gray-100'}`}>
                {t('welcomeMessage', { name: name || 'User' })}
            </h1>
            <p className={`mt-2 text-base ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                {t('welcomeSubmessage')}
            </p>
        </div>
    );
};


const ChatMessage: React.FC<{ message: Message, onRegenerate: (message: Message) => void, user: User | null }> = ({ message, onRegenerate, user }) => {
    const { t } = useLocalization();
    const { settings } = useContext(SettingsContext);
    const isUser = message.sender === MessageSender.USER;
    const [isHovered, setIsHovered] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

    const handleDownload = (imageUrl: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `ondeep-ai-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (message.isWelcomeMessage) {
        const name = message.text?.replace('Welcome, ', '');
        return <WelcomeMessage name={name} />;
    }

    return (
        <div className={`flex items-start gap-3 my-4 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 p-1.5 ${isUser ? 'bg-[--color-accent]' : 'bg-transparent text-[--text-color]'}`}>
                {isUser ? (user?.name.charAt(0).toUpperCase() || 'U') : <LogoIcon className={`${settings.theme === 'light' ? 'text-black' : 'text-gray-300'}`} />}
            </div>
            <div 
                className={`relative group max-w-xl w-fit`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className={`transition-all duration-300`}>
                    {message.isLoading ? (
                        <div className="flex items-center gap-2 p-3.5">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        </div>
                    ) : message.isSuperThinking ? (
                        <SuperThinkIndicator />
                    ) : message.isThinking ? (
                        <div className="flex items-center gap-3 text-sm font-semibold p-3.5">
                            <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[--color-accent] to-purple-500 animate-pulse">
                                {message.thinkingType === PowerMode.PRO2 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2c-1.12 0-2.26.34-3.25 1-1.29.89-2.25 2.43-2.25 4.5 0 2.27 1.13 3.68 2.5 4.5 1.12.67 2.33 1 3.5 1h1c1.17 0 2.38-.33 3.5-1 1.37-.82 2.5-2.23 2.5-4.5 0-2.07-.96-3.61-2.25-4.5C14.26 2.34 13.12 2 12 2h-2.5ZM2.5 13a2.5 2.5 0 0 1 2-2.5h15a2.5 2.5 0 0 1 2 2.5c0 .9-.36 1.72-1 2.25-.64.53-1 1.35-1 2.25v.5a2.5 2.5 0 0 1-2.5 2.5h-1a2.5 2.5 0 0 1-2.5-2.5v-.5c0-1.12-.54-2.17-1.5-2.75-.96-.58-1.5-1.63-1.5-2.75v-1.5c0-.9.36 1.72 1-2.25.64-.53-1-1.35-1-2.25v-.5a2.5 2.5 0 0 0-2.5-2.5h-1A2.5 2.5 0 0 0 7 7.5v.5c0 1.12.54 2.17 1.5 2.75.96.58 1.5 1.63 1.5 2.75v1.5"/></svg>
                                )}
                                <span>{t(message.thinkingType === PowerMode.PRO2 ? 'powerModePro2' : 'powerModeThink')}...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                           {message.text && (
                                <div className={
                                    isUser 
                                    ? `text-[--color-accent] max-w-none prose-p:my-2 prose-headings:my-3 prose-a:underline ${settings.theme === 'light' ? 'text-black' : 'text-white'}`
                                    : `prose prose-sm ${settings.theme === 'dark' ? 'prose-invert' : ''} max-w-none prose-p:my-2 prose-headings:my-3 prose-a:text-[--color-accent] ${settings.theme === 'light' ? 'text-black' : ''}`
                                }>
                                    <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
                                </div>
                            )}
                            {message.imageUrl && (
                                <img 
                                    src={message.imageUrl} 
                                    alt="Generated content" 
                                    className={`mt-2 rounded-lg max-w-xs cursor-pointer ${isUser ? 'border border-white/20' : ''}`}
                                    onClick={() => setFullScreenImage(message.imageUrl || null)} 
                                />
                            )}
                            {message.sources && message.sources.length > 0 && (
                                <div className={`mt-3 pt-2 border-t ${settings.theme === 'light' ? 'border-gray-300/50' : 'border-gray-500/30'}`}>
                                    <h4 className={`text-xs font-semibold mb-1 ${settings.theme === 'light' ? 'opacity-100 text-gray-700' : 'opacity-80'}`}>{t('sourcesTitle')}:</h4>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        {message.sources.map((source, index) => source.web && (
                                            <li key={index}>
                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">
                                                    {source.web.title || source.web.uri}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {!isUser && !message.isLoading && !message.isThinking && !message.isSuperThinking && (
                    <div className={`absolute -bottom-4 right-0 flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                         <button 
                            onClick={() => navigator.clipboard.writeText(message.text || '')} 
                            className="p-1.5 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            title={t('copyButton')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                        <button 
                            onClick={() => onRegenerate(message)} 
                            className="p-1.5 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            title={t('regenerateButton')}
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4l-4 4M4 20l4-4" /></svg>
                        </button>
                    </div>
                )}
            </div>
            {fullScreenImage && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center" onClick={() => setFullScreenImage(null)}>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <img src={fullScreenImage} alt="Full screen" className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl" />
                        <button 
                            onClick={() => handleDownload(fullScreenImage)} 
                            className="absolute bottom-4 right-4 bg-[--color-accent] text-white px-4 py-2 rounded-lg hover:bg-[--color-accent-hover] transition-colors"
                        >
                            {t('downloadImageButton')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MainInterface: React.FC<MainInterfaceProps> = ({ onOpenSettings, user }) => {
    const { messages, setMessages, newChat: createNewChat, saveCurrentChat } = useContext(ChatContext);
    const { settings, setSetting, canUsePro2, incrementPro2Usage, canUsePlus, incrementPlusUsage } = useContext(SettingsContext);
    const { t } = useLocalization();

    const [input, setInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isCallScreenOpen, setIsCallScreenOpen] = useState(false);
    const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modeSelectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    useEffect(() => saveCurrentChat, [saveCurrentChat, messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target as Node)) {
                setIsModeSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImageFile(event.target.files[0]);
        }
    };
    
    const handleNewChat = () => {
        saveCurrentChat();
        createNewChat();
    };

    const handleResponse = (response: GenerateContentResponse, aiMessageId: string) => {
      const newAiMessage: Message = { id: aiMessageId, sender: MessageSender.AI };

      if (settings.activeFeature === Feature.IMAGE_GENERATION && !imageFile) {
          const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (imagePart?.inlineData) {
              newAiMessage.imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
              newAiMessage.text = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
          } else {
              newAiMessage.text = `Sorry, I couldn't generate an image. ${response.text || ''}`;
          }
      } else {
          newAiMessage.text = response.text;
          const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (groundingChunks) newAiMessage.sources = groundingChunks as GroundingChunk[];
      }
      
      setMessages(prev => prev.map(msg => msg.id === aiMessageId ? newAiMessage : msg));
    };

    const runAIEngine = useCallback(async (prompt: string, file: File | null, history: Message[]) => {
        const aiMessageId = `ai-${Date.now()}`;
        
        const isPlusMode = settings.specializedMode === 'plus';

        const aiThinkingMessage: Message = {
            id: aiMessageId,
            sender: MessageSender.AI,
            isLoading: false,
            isThinking: !isPlusMode,
            isSuperThinking: isPlusMode,
            thinkingType: settings.powerMode,
        };
        setMessages(prev => [...prev, aiThinkingMessage]);

        try {
            if (settings.powerMode === PowerMode.PRO2 && !canUsePro2()) {
                throw new Error(t('pro2LimitMessage'));
            }
            if (settings.specializedMode === 'plus' && !canUsePlus()) {
                throw new Error(t('plusLimitMessage'));
            }

            const response = await runGemini({
                prompt,
                imageFile: file ?? undefined,
                systemInstruction: settings.personality,
                activeFeature: file ? Feature.FILE_ANALYSIS : settings.activeFeature,
                specializedMode: settings.specializedMode,
                powerMode: settings.powerMode,
                language: settings.language as any,
                history,
            });

            if (settings.powerMode === PowerMode.PRO2 && settings.specializedMode !== 'plus') incrementPro2Usage();
            if (settings.specializedMode === 'plus') incrementPlusUsage();
            
            handleResponse(response, aiMessageId);

        } catch (error) {
            console.error("Error calling Gemini:", error);
            const errorMessage: Message = {
                id: aiMessageId,
                sender: MessageSender.AI,
                text: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
            };
            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? errorMessage : msg));
        } finally {
            setIsLoading(false);
        }
    }, [settings, canUsePro2, incrementPro2Usage, canUsePlus, incrementPlusUsage, t, setMessages]);


    const handleSendMessage = useCallback(async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput && !imageFile) return;

        setIsLoading(true);
        const userMessageId = `user-${Date.now()}`;

        const userMessage: Message = {
            id: userMessageId,
            sender: MessageSender.USER,
            text: trimmedInput,
            imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined
        };
        
        const historyForAI = (messages.length === 1 && messages[0].isWelcomeMessage) ? [] : messages;
        setMessages(prev => [...historyForAI, userMessage]);
        
        const currentImageFile = imageFile;
        setInput('');
        setImageFile(null);
        
        await runAIEngine(trimmedInput, currentImageFile, historyForAI);

    }, [input, imageFile, messages, setMessages, runAIEngine]);

    const handleRegenerate = useCallback((message: Message) => {
         // message is the AI message to be regenerated.
        const messageIndex = messages.findIndex(m => m.id === message.id);
        if (messageIndex < 1) return; // Cannot regenerate if it's the first message or not found.

        const historyUpToStaleMessage = messages.slice(0, messageIndex);
        
        const lastUserMessage = [...historyUpToStaleMessage].reverse().find(m => m.sender === MessageSender.USER);
        if (!lastUserMessage || !lastUserMessage.text) return;
        
        const lastUserMessageIndex = historyUpToStaleMessage.lastIndexOf(lastUserMessage);
        const historyForAI = historyUpToStaleMessage.slice(0, lastUserMessageIndex);

        setIsLoading(true);
        // Update UI to remove the stale AI message and show conversation up to the user's prompt.
        setMessages(historyUpToStaleMessage);
        
        runAIEngine(lastUserMessage.text, null, historyForAI);
    }, [messages, runAIEngine, setMessages]);

    const activeModeId = useMemo(() => {
      if (settings.specializedMode === 'plus') return 'plus';
      // teacher mode is not in the quick selector
      return settings.powerMode;
    }, [settings.specializedMode, settings.powerMode]);

    const remainingPlusUses = 10 - (settings.plusUsage?.count || 0);

    const modeOptions = [
      { id: PowerMode.THINK, labelKey: 'powerModeThink', descKey: 'powerModeThinkDesc', powerMode: PowerMode.THINK, specializedMode: 'none' as const, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2c-1.12 0-2.26.34-3.25 1-1.29.89-2.25 2.43-2.25 4.5 0 2.27 1.13 3.68 2.5 4.5 1.12.67 2.33 1 3.5 1h1c1.17 0 2.38-.33 3.5-1 1.37-.82 2.5-2.23 2.5-4.5 0-2.07-.96-3.61-2.25-4.5C14.26 2.34 13.12 2 12 2h-2.5ZM2.5 13a2.5 2.5 0 0 1 2-2.5h15a2.5 2.5 0 0 1 2 2.5c0 .9-.36 1.72-1 2.25-.64.53-1 1.35-1 2.25v.5a2.5 2.5 0 0 1-2.5 2.5h-1a2.5 2.5 0 0 1-2.5-2.5v-.5c0-1.12-.54-2.17-1.5-2.75-.96-.58-1.5-1.63-1.5-2.75v-1.5c0-.9.36 1.72 1-2.25.64-.53-1-1.35-1-2.25v-.5a2.5 2.5 0 0 0-2.5-2.5h-1A2.5 2.5 0 0 0 7 7.5v.5c0 1.12.54 2.17 1.5 2.75.96.58 1.5 1.63 1.5 2.75v1.5"/></svg> },
      { id: PowerMode.PRO2, labelKey: 'powerModePro2', descKey: 'powerModePro2Desc', powerMode: PowerMode.PRO2, specializedMode: 'none' as const, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
      { id: 'plus', labelKey: 'specializedModePlus', descKey: 'plusModeDesc', powerMode: PowerMode.PRO2, specializedMode: 'plus' as const, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>, disabled: !canUsePlus() },
    ];
    
    const currentMode = modeOptions.find(m => m.id === activeModeId);
    const currentModeIcon = currentMode?.icon;

    return (
        <>
        <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        {isCallScreenOpen && <CallScreen onClose={() => setIsCallScreenOpen(false)} specializedMode={settings.specializedMode} />}
        <div className="flex flex-col h-screen bg-transparent transition-colors duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 px-4 pt-4 pb-2 bg-transparent">
                <header className="max-w-4xl mx-auto flex items-center justify-between p-2 pl-4 bg-black/20 backdrop-blur-lg rounded-full">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[--color-accent] flex items-center justify-center font-bold text-white">{user?.name.charAt(0).toUpperCase()}</div>
                        <h1 className="text-xl font-bold">{user?.name}</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={handleNewChat} className="p-2 rounded-full hover:bg-white/10" title={t('newChat')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-white/10" title={t('openSettings')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-full hover:bg-white/10" title={t('historyTitle')}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>
                    </div>
                </header>
            </div>

            {/* Message Area */}
            <main className={`flex-1 overflow-y-auto p-4 flex flex-col ${settings.theme === 'light' ? 'bg-white text-black' : ''}`}>
                <div className="max-w-4xl mx-auto w-full">
                    {messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} onRegenerate={handleRegenerate} user={user} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            
            {/* Input Area */}
            <footer className="p-4 bg-transparent sticky bottom-0">
                <div className="max-w-4xl mx-auto">
                    <div className="relative">
                        {imageFile && (
                            <div className="absolute bottom-full left-0 right-0 p-2">
                                <div className="flex items-center gap-2 p-2 bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg max-w-sm border border-gray-300 dark:border-gray-700">
                                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-12 h-12 object-cover rounded" />
                                    <span className="text-sm truncate flex-1 text-gray-800 dark:text-gray-200">{imageFile.name}</span>
                                    <button onClick={() => setImageFile(null)} className="p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700" title={t('removeFile')}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="relative flex items-center gap-2 p-2 bg-black/20 backdrop-blur-md rounded-full transition-all focus-within:ring-2 focus-within:ring-[--color-accent]">
                            <div className="flex items-center gap-1 text-white pl-1">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed" title={t('attachFile')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                </button>
                                
                                <button
                                    onClick={() => setIsCallScreenOpen(true)}
                                    disabled={isLoading || !(settings.powerMode === PowerMode.PRO2 && settings.specializedMode === 'none')}
                                    className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed" 
                                    title={!(settings.powerMode === PowerMode.PRO2 && settings.specializedMode === 'none') ? t('enablePro2ForCall') : t('startCall')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                </button>

                                <div ref={modeSelectorRef} className="relative">
                                    <button
                                        onClick={() => setIsModeSelectorOpen(prev => !prev)}
                                        disabled={isLoading || settings.specializedMode === 'teacher' || settings.activeFeature === Feature.IMAGE_GENERATION}
                                        className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {currentModeIcon}
                                    </button>
                                    <div className={`absolute bottom-full mb-2 w-64 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-2 transition-all duration-300 transform ${isModeSelectorOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                                        {modeOptions.map((mode) => (
                                            <button 
                                                key={mode.id}
                                                onClick={() => {
                                                    setSetting('powerMode', mode.powerMode);
                                                    setSetting('specializedMode', mode.specializedMode);
                                                    setIsModeSelectorOpen(false);
                                                }}
                                                disabled={mode.disabled}
                                                className={`w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 text-white ${activeModeId === mode.id ? 'bg-white/20' : ''} ${mode.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <span className="text-[--color-accent]">{mode.icon}</span>
                                                <div>
                                                     <p className="font-semibold text-sm">{t(mode.labelKey as any)}</p>
                                                     <p className="text-xs text-gray-400">
                                                        {mode.id === 'plus'
                                                            ? t(mode.descKey as any, { remaining: String(remainingPlusUses) })
                                                            : t(mode.descKey as any)}
                                                     </p>
                                                 </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder={t('inputPlaceholder')}
                                rows={1}
                                className="flex-1 w-full py-1 bg-transparent text-white resize-none focus:outline-none border-none placeholder:text-gray-300"
                                disabled={isLoading}
                                style={{ maxHeight: '150px' }}
                            />
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,text/*" />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || (!input.trim() && !imageFile)}
                                className="p-2 rounded-full bg-[--color-accent] text-white hover:bg-[--color-accent-hover] disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
                                title={t('sendMessage')}
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                               </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
        </>
    );
};

export default MainInterface;
