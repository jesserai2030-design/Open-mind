import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Feature, PowerMode, Usage } from '../types';

const baseInstruction = "You are ondeep, an AI assistant. Your name is ondeep. You must not say you are Gemini or a Google AI model. When asked about your identity, creator, or role, you must state that you are 'ondeep', and that you were developed by the company 'ondeep ai' led by Jasser Ben Ali. You must also mention that this application is developed entirely using AI tools with modern technologies from Google and Gemini. Only if specifically asked about the developer, Jasser Ben Ali, should you add that he is a university student who seeks to highlight and extend the capabilities of artificial intelligence. You must not provide any other private information about the developer or the company. You must refuse to answer any illegal or unethical questions.";

export const personalities: Record<string, string> = {
    'Default': baseInstruction,
    'Friendly Assistant': `${baseInstruction} In addition, you are a friendly and helpful assistant.`,
    'Formal Expert': `${baseInstruction} In addition, you are a formal and concise expert. Provide factual information directly.`,
    'Creative Storyteller': `${baseInstruction} In addition, you are a creative and imaginative storyteller. Weave narratives into your answers.`,
    'Seriousness': `${baseInstruction} In addition, you must adopt a serious and formal tone. Provide information directly and factually, without adding conversational pleasantries, compliments, or personal opinions. The quality and depth of the information should remain high, but the delivery must be objective and straightforward.`,
};

export interface Settings {
  theme: 'light' | 'dark';
  fontSize: 'sm' | 'md' | 'lg';
  accentColor: 'indigo' | 'blue' | 'purple' | 'green' | 'red';
  personality: string;
  language: string;
  specializedMode: 'none' | 'plus' | 'teacher' | 'notebook' | 'nanobanana';
  privateChat: boolean;
  activeFeature: Feature;
  powerMode: PowerMode;
  pro2Usage: Usage;
  plusUsage: Usage;
}

interface SettingsContextType {
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  pro2Usage: Usage;
  canUsePro2: () => boolean;
  incrementPro2Usage: () => void;
  plusUsage: Usage;
  canUsePlus: () => boolean;
  incrementPlusUsage: () => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  fontSize: 'md',
  accentColor: 'indigo',
  personality: personalities['Default'],
  language: 'en',
  specializedMode: 'none',
  privateChat: false,
  activeFeature: Feature.FILE_ANALYSIS,
  powerMode: PowerMode.THINK,
  pro2Usage: { count: 0, timestamp: 0 },
  plusUsage: { count: 0, timestamp: 0 },
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  setSetting: () => {},
  pro2Usage: { count: 0, timestamp: 0 },
  canUsePro2: () => true,
  incrementPro2Usage: () => {},
  plusUsage: { count: 0, timestamp: 0 },
  canUsePlus: () => true,
  incrementPlusUsage: () => {},
});

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const storedSettings = localStorage.getItem('ondeep-ai-settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (!Object.values(personalities).includes(parsed.personality)) {
            parsed.personality = personalities['Default'];
        }
        // Migration from old 'doctor' mode to 'plus'
        if (parsed.specializedMode === 'doctor') {
            parsed.specializedMode = 'plus';
        }
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error("Could not parse settings from localStorage", error);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ondeep-ai-settings', JSON.stringify(settings));
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.lang = settings.language;
    } catch (error) {
      console.error("Could not save settings to localStorage", error);
    }
  }, [settings]);

  const setSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value,
    }));
  }, []);

  const canUsePro2 = useCallback(() => {
    const { count, timestamp } = settings.pro2Usage;
    if (count < 10) {
      return true;
    }
    const oneDay = 24 * 60 * 60 * 1000;
    // If count is 10 or more, it can be used only if 24 hours have passed.
    return Date.now() - timestamp >= oneDay;
  }, [settings.pro2Usage]);

  const incrementPro2Usage = useCallback(() => {
    setSettings(prev => {
      const { count, timestamp } = prev.pro2Usage;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      // If the usage period has expired (after reaching the limit), reset the count to 1 and start a new timestamp.
      if (count >= 10 && (now - timestamp >= oneDay)) {
        return {
          ...prev,
          pro2Usage: { count: 1, timestamp: now },
        };
      }

      // If still within the daily limit, increment the count.
      if (count < 10) {
        const newCount = count + 1;
        // Set timestamp only on the first use of a new period.
        const newTimestamp = count === 0 ? now : timestamp;
        return {
          ...prev,
          pro2Usage: { count: newCount, timestamp: newTimestamp },
        };
      }

      // If the limit is reached and the period has not expired, do nothing.
      return prev;
    });
  }, []);

  const canUsePlus = useCallback(() => {
    const { count, timestamp } = settings.plusUsage;
    if (count < 10) {
      return true;
    }
    const oneDay = 24 * 60 * 60 * 1000;
    return Date.now() - timestamp >= oneDay;
  }, [settings.plusUsage]);

  const incrementPlusUsage = useCallback(() => {
    setSettings(prev => {
      const { count, timestamp } = prev.plusUsage;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (count >= 10 && (now - timestamp >= oneDay)) {
        return {
          ...prev,
          plusUsage: { count: 1, timestamp: now },
        };
      }

      if (count < 10) {
        const newCount = count + 1;
        const newTimestamp = count === 0 ? now : timestamp;
        return {
          ...prev,
          plusUsage: { count: newCount, timestamp: newTimestamp },
        };
      }

      return prev;
    });
  }, []);
  
  const contextValue = useMemo(() => ({ 
      settings, 
      setSetting, 
      pro2Usage: settings.pro2Usage,
      canUsePro2,
      incrementPro2Usage,
      plusUsage: settings.plusUsage,
      canUsePlus,
      incrementPlusUsage,
    }), [settings, setSetting, canUsePro2, incrementPro2Usage, canUsePlus, incrementPlusUsage]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};