import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

interface LegalModalProps {
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ onClose }) => {
  const { t } = useLocalization();
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white/50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-2xl shadow-2xl p-6 m-4 text-black dark:text-gray-200 animate-slide-up overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{t('termsTitle')}</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-6 text-sm text-gray-800 dark:text-gray-300">
            <p>{t('termsIntro')}</p>
            
            <div>
                <h3 className="font-semibold text-lg mb-2 text-black dark:text-gray-200">{t('termsOurTitle')}</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>{t('termsOur1')}</li>
                    <li>{t('termsOur2')}</li>
                    <li>{t('termsOur3')}</li>
                </ul>
            </div>
            
            <div>
                <h3 className="font-semibold text-lg mb-2 text-black dark:text-gray-200">{t('termsPrivacyTitle')}</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>{t('termsPrivacy1')}</li>
                    <li>{t('termsPrivacy2')}</li>
                </ul>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-2 text-black dark:text-gray-200">{t('termsGoogleTitle')}</h3>
                <p>
                    {t('termsGoogle1')}
                    <a href="https://ai.google.dev/terms/gemini-api" target="_blank" rel="noopener noreferrer" className="text-[--color-accent] hover:underline">
                        {t('termsGoogle2')}
                    </a>
                    {t('termsGoogle3')}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
