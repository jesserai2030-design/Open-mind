import React, { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { useLocalization } from '../hooks/useLocalization';

interface HistorySidebarProps {
  onClose: () => void;
  isOpen: boolean;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ onClose, isOpen }) => {
  const { history, loadChat, newChat } = useContext(ChatContext);
  const { t } = useLocalization();

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-l border-gray-300 dark:border-gray-700/50 z-40 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-black dark:text-gray-200">{t('historyTitle')}</h2>
            <button 
              onClick={newChat} 
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
              title={t('newChat')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="flex-grow overflow-y-auto space-y-2">
            {history.length > 0 ? (
              history.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => { loadChat(chat.id); onClose(); }}
                  className="w-full text-left p-2.5 rounded-md bg-white/50 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <p className="text-sm font-medium truncate text-black dark:text-gray-200">{chat.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(chat.timestamp).toLocaleString()}</p>
                </button>
              ))
            ) : (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">{t('historyEmpty')}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;