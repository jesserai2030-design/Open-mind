import React, { useState, useContext, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import MainInterface from './components/MainInterface';
import SettingsScreen from './components/SettingsScreen';
import { SettingsProvider, SettingsContext } from './contexts/SettingsContext';
import { ChatProvider, ChatContext } from './contexts/ChatContext';
import { User } from './types';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { settings } = useContext(SettingsContext);
  const { initializeChat, setUserNameForChat } = useContext(ChatContext);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setUserNameForChat(userData.name);
    initializeChat(userData.name);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsSettingsOpen(false);
  };

  return (
    <div className={`${settings.theme} theme-${settings.accentColor} font-size-${settings.fontSize} min-h-screen bg-transparent`}>
      {isAuthenticated ? (
        <>
          <MainInterface onOpenSettings={() => setIsSettingsOpen(true)} user={user} />
          {isSettingsOpen && <SettingsScreen onClose={() => setIsSettingsOpen(false)} user={user} onLogout={handleLogout} />}
        </>
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
};


const App: React.FC = () => {
  return (
    <SettingsProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </SettingsProvider>
  );
};


export default App;