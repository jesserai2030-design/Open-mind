import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Message, MessageSender } from '../types';

const MAX_HISTORY_SIZE = 10;
const HISTORY_STORAGE_KEY = 'ondeep-ai-chat-history';

interface ChatHistoryEntry {
  id: string;
  timestamp: number;
  messages: Message[];
  title: string;
}

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  history: ChatHistoryEntry[];
  saveCurrentChat: () => void;
  loadChat: (id: string) => void;
  clearHistory: () => void;
  newChat: () => void;
  initializeChat: (userName: string) => void;
  setUserNameForChat: (name: string) => void;
}

export const ChatContext = createContext<ChatContextType>({
  messages: [],
  setMessages: () => {},
  history: [],
  saveCurrentChat: () => {},
  loadChat: () => {},
  clearHistory: () => {},
  newChat: () => {},
  initializeChat: () => {},
  setUserNameForChat: () => {},
});

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Could not load chat history from localStorage", error);
    }
  }, []);

  const saveHistoryToStorage = (newHistory: ChatHistoryEntry[]) => {
      try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
          console.error("Could not save chat history to localStorage", error);
      }
  };
  
  const setUserNameForChat = (name: string) => {
    setUserName(name);
  };

  const initializeChat = useCallback((name: string) => {
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      sender: MessageSender.SYSTEM,
      text: `Welcome, ${name}`,
      isWelcomeMessage: true,
    };
    setMessages([welcomeMessage]);
  }, []);

  const saveCurrentChat = useCallback(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].isWelcomeMessage)) return;

    setHistory(prevHistory => {
        const firstUserMessage = messages.find(m => m.sender === MessageSender.USER);
        const chatId = firstUserMessage?.id || messages[1]?.id || Date.now().toString();

        const newEntry: ChatHistoryEntry = {
            id: chatId,
            timestamp: Date.now(),
            messages: messages,
            title: firstUserMessage?.text?.substring(0, 50) || 'Chat'
        };

        const existingIndex = prevHistory.findIndex(h => h.id === newEntry.id);
        let updatedHistory;

        if (existingIndex > -1) {
            updatedHistory = [...prevHistory];
            updatedHistory[existingIndex] = newEntry;
        } else {
            updatedHistory = [newEntry, ...prevHistory];
        }

        const finalHistory = updatedHistory.slice(0, MAX_HISTORY_SIZE);
        saveHistoryToStorage(finalHistory);
        return finalHistory;
    });
  }, [messages]);

  const loadChat = useCallback((id: string) => {
    saveCurrentChat();
    const chatToLoad = history.find(h => h.id === id);
    if (chatToLoad) {
      setMessages(chatToLoad.messages);
    }
  }, [history, saveCurrentChat]);
  
  const clearHistory = useCallback(() => {
      setHistory([]);
      saveHistoryToStorage([]);
  }, []);

  const newChat = useCallback(() => {
    saveCurrentChat();
    if(userName){
        initializeChat(userName);
    }
  }, [saveCurrentChat, initializeChat, userName]);

  const contextValue = useMemo(() => ({
    messages,
    setMessages,
    history,
    saveCurrentChat,
    loadChat,
    clearHistory,
    newChat,
    initializeChat,
    setUserNameForChat,
  }), [messages, history, saveCurrentChat, loadChat, clearHistory, newChat, initializeChat]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};