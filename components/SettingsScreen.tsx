
import React, { useContext, useState } from 'react';
import { SettingsContext, Settings, personalities } from '../contexts/SettingsContext';
import { ChatContext } from '../contexts/ChatContext';
import { User, Feature } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import PromoVideoGenerator from './PromoVideoGenerator';

// --- Icon Components ---
const ThemeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const FontIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v18M6.6 11.5h6.8" /></svg>;
const ColorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const FeatureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const PersonalityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const LanguageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9M3 12a9 9 0 019-9m-9 9a9 9 0 009 9m-9-9h18" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const AboutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const DevInfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>;


const DevInfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLocalization();
    return (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] animate-fade-in"
          onClick={onClose}
        >
          <div 
            className="w-full max-w-2xl bg-[--bg-secondary-color]/80 border border-[--border-color] rounded-2xl shadow-2xl p-6 m-4 text-[--text-color] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t('devInfoTitle')}</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-6 text-sm text-gray-300 max-h-[75vh] overflow-y-auto pr-4">
                <div className="p-4 bg-black/20 rounded-xl">
                    <h3 className="font-bold text-lg text-gray-100 mb-2">{t('devInfoGeminiTitle')}</h3>
                    <p>{t('devInfoGeminiText')}</p>
                    <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-[--color-accent] hover:underline mt-2 inline-block">
                        {t('devInfoGeminiLink')}
                    </a>
                </div>
                 <div className="p-4 bg-black/20 rounded-xl">
                    <h3 className="font-bold text-lg text-gray-100 mb-2">{t('devInfoGoogleAITitle')}</h3>
                    <p>{t('devInfoGoogleAIText')}</p>
                    <a href="https://ai.google/" target="_blank" rel="noopener noreferrer" className="text-[--color-accent] hover:underline mt-2 inline-block">
                       {t('devInfoGoogleAILink')}
                    </a>
                </div>
            </div>
          </div>
        </div>
    );
};

const AboutModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
  const { t } = useLocalization();
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[--bg-secondary-color]/80 border border-[--border-color] rounded-2xl shadow-2xl p-6 m-4 text-[--text-color] animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{t('legalTitle')}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="space-y-4 text-sm text-gray-300 max-h-[75vh] overflow-y-auto pr-4">
            <p className="font-semibold">{t('legalIntroTitle')}</p><p>{t('legalIntroText')}</p>
            <h3 className="font-semibold text-base text-gray-100 pt-2">{t('legalTechTitle')}</h3><p>{t('legalTechText')}</p>
            <h3 className="font-semibold text-base text-gray-100 pt-2">{t('legalDataCollectionTitle')}</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>{t('legalDataCollectionLimitsTitle')}:</strong> {t('legalDataCollectionLimitsText')}</li>
                <li><strong>{t('legalDataCollectionOperationalTitle')}:</strong> {t('legalDataCollectionOperationalText')}</li>
                <li><strong>{t('legalDataCollectionAuthTitle')}:</strong> {t('legalDataCollectionAuthText')}</li>
            </ul>
            <h3 className="font-semibold text-base text-gray-100 pt-2">{t('legalGoogleComplianceTitle')}</h3>
            <p>{t('legalGoogleComplianceText')}<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--color-accent] hover:underline">https://policies.google.com/privacy</a>.</p>
            <h3 className="font-semibold text-base text-gray-100 pt-2">{t('legalLiabilityTitle')}</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>{t('legalLiabilityContentNatureTitle')}:</strong> {t('legalLiabilityContentNatureText')}</li>
                <li><strong>{t('legalLiabilityAcceptableUseTitle')}:</strong> {t('legalLiabilityAcceptableUseText')}</li>
                <li><strong>{t('legalLiabilityWarrantyLimitTitle')}:</strong> {t('legalLiabilityWarrantyLimitText')}</li>
            </ul>
            <h3 className="font-semibold text-base text-gray-100 pt-2">{t('legalUserRightsTitle')}</h3><p>{t('legalUserRightsText')}</p>
            <h3 className="font-semibold text-base text-gray-100 pt-2">{t('legalPolicyChangesTitle')}</h3><p>{t('legalPolicyChangesText')}</p>
            <h3 className="font-semibold text-base text-gray-100 pt-2">{t('legalContactTitle')}</h3><p>{t('legalContactText')}</p>
        </div>
      </div>
    </div>
  );
};

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} disabled={disabled} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-[--color-accent]' : 'bg-gray-300 dark:bg-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
);

const SettingCircleButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 text-center w-24 h-24 justify-start group">
    <div className="w-16 h-16 bg-white/5 dark:bg-black/20 rounded-full flex items-center justify-center text-gray-200 group-hover:bg-[--color-accent] group-hover:text-white transition-all duration-200 transform group-hover:scale-110">
      {icon}
    </div>
    <span className="text-xs font-medium text-gray-300">{label}</span>
  </button>
);

const SettingPanel: React.FC<{ title: string; onBack: () => void; children: React.ReactNode; }> = ({ title, onBack, children }) => (
  <div className="w-full animate-fade-in">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="p-2 mr-2 rounded-full hover:bg-white/10 dark:hover:bg-black/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h3 className="text-xl font-bold">{title}</h3>
    </div>
    <div className="space-y-4 px-2">{children}</div>
  </div>
);

const languageList = [ { code: 'en', name: 'English' }, { code: 'ar', name: 'العربية (Arabic)' }, { code: 'es', name: 'Español (Spanish)' }, { code: 'fr', name: 'Français (French)' }, { code: 'de', name: 'Deutsch (German)' }, { code: 'zh', name: '中文 (Chinese)' }, ];
const accentColors: Settings['accentColor'][] = ['indigo', 'blue', 'purple', 'green', 'red'];

interface SettingsScreenProps { onClose: () => void; user: User | null; onLogout: () => void; }

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, user, onLogout }) => {
  const { settings, setSetting } = useContext(SettingsContext);
  const { history, loadChat, clearHistory } = useContext(ChatContext);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isDevInfoModalOpen, setIsDevInfoModalOpen] = useState(false);
  const [isPromoVideoModalOpen, setIsPromoVideoModalOpen] = useState(false);
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const { t } = useLocalization();

  const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]) => setSetting(key, value);
  const isImageGenActive = settings.activeFeature === Feature.IMAGE_GENERATION;

  const settingPanels: { [key: string]: { title: string; content: React.ReactNode } } = {
    theme: { title: t('themeLabel'), content: <div className="p-3 bg-black/20 rounded-xl"><div className="flex items-center justify-between"><label className="font-medium">{t('themeLabel')}</label><div className="flex items-center gap-2 p-1 bg-gray-800 rounded-full"><button onClick={() => handleSettingChange('theme', 'light')} className={`px-3 py-1 text-sm rounded-full ${settings.theme === 'light' ? 'bg-white shadow text-black' : 'text-gray-300'}`}>{t('themeLight')}</button><button onClick={() => handleSettingChange('theme', 'dark')} className={`px-3 py-1 text-sm rounded-full ${settings.theme === 'dark' ? 'bg-gray-700 text-gray-100 shadow' : 'text-gray-300'}`}>{t('themeDark')}</button></div></div></div> },
    fontSize: { title: t('fontSizeLabel'), content: <div className="p-3 bg-black/20 rounded-xl"><div className="flex items-center justify-between"><label className="font-medium">{t('fontSizeLabel')}</label><div className="flex items-center gap-2 p-1 bg-gray-800 rounded-full"><button onClick={() => handleSettingChange('fontSize', 'sm')} className={`px-3 py-1 text-sm rounded-full ${settings.fontSize === 'sm' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>{t('fontSizeSmall')}</button><button onClick={() => handleSettingChange('fontSize', 'md')} className={`px-3 py-1 text-sm rounded-full ${settings.fontSize === 'md' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>{t('fontSizeMedium')}</button><button onClick={() => handleSettingChange('fontSize', 'lg')} className={`px-3 py-1 text-sm rounded-full ${settings.fontSize === 'lg' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>{t('fontSizeLarge')}</button></div></div></div> },
    accentColor: { title: t('accentColorLabel'), content: <div className="p-3 bg-black/20 rounded-xl"><div className="flex items-center justify-between"><label className="font-medium">{t('accentColorLabel')}</label><div className="flex items-center gap-3">{accentColors.map(color => (<button key={color} onClick={() => handleSettingChange('accentColor', color)} className={`w-7 h-7 rounded-full theme-${color} bg-[--color-accent] transition-transform duration-200 ${settings.accentColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-[--color-accent]' : ''}`}/>))}</div></div></div> },
    features: { title: t('geminiFeaturesButton'), content: <div className={`p-3 bg-black/20 rounded-xl transition-opacity ${settings.specializedMode !== 'none' ? 'opacity-50 cursor-not-allowed' : ''}`}><div className={`flex items-center justify-between`}><div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>{t('featureImageGeneration')}</span></div><ToggleSwitch checked={isImageGenActive} onChange={(checked) => handleSettingChange('activeFeature', checked ? Feature.IMAGE_GENERATION : Feature.FILE_ANALYSIS)} disabled={settings.specializedMode !== 'none'}/></div></div> },
    personality: { title: t('aiPersonalityLabel'), content: <div className={`p-3 bg-black/20 rounded-xl space-y-3 transition-opacity ${isImageGenActive ? 'opacity-50 cursor-not-allowed' : ''}`}><div><label htmlFor="specializedMode" className={`font-medium`}>{t('specializedModeLabel')}</label><select id="specializedMode" value={settings.specializedMode} onChange={(e) => handleSettingChange('specializedMode', e.target.value as Settings['specializedMode'])} disabled={isImageGenActive} className="w-full mt-1 p-2 bg-gray-800 border-gray-700 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-[--color-accent] disabled:opacity-50 disabled:cursor-not-allowed"><option value="none">{t('specializedModeNormal')}</option><option value="plus">{t('specializedModePlus')}</option><option value="teacher">{t('specializedModeTeacher')}</option></select></div><div><label htmlFor="personality" className={`font-medium`}>{t('aiPersonalityLabel')}</label><select id="personality" value={settings.personality} onChange={(e) => handleSettingChange('personality', e.target.value)} disabled={isImageGenActive} className="w-full mt-1 p-2 bg-gray-800 border-gray-700 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-[--color-accent] disabled:opacity-50 disabled:cursor-not-allowed">{Object.entries(personalities).map(([key, value]) => (<option key={key} value={value}>{t(key as any)}</option>))}</select></div></div> },
    language: { title: t('appLanguageLabel'), content: <div className="p-3 bg-black/20 rounded-xl"><label htmlFor="language" className="font-medium">{t('appLanguageLabel')}</label><select id="language" value={settings.language} onChange={(e) => handleSettingChange('language', e.target.value)} className="w-full mt-1 p-2 bg-gray-800 border-gray-700 rounded-lg focus:ring-2 focus:ring-[--color-accent] focus:border-[--color-accent]">{languageList.map(lang => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}</select></div> },
  };

  const currentPanel = activeSetting ? settingPanels[activeSetting] : null;

  return (
    <>
    {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
    {isDevInfoModalOpen && <DevInfoModal onClose={() => setIsDevInfoModalOpen(false)} />}
    {isPromoVideoModalOpen && <PromoVideoGenerator onClose={() => setIsPromoVideoModalOpen(false)} />}
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-[--bg-secondary-color]/60 backdrop-blur-2xl border border-[--border-color] rounded-3xl shadow-2xl p-6 m-4 text-gray-200 animate-slide-up overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {!currentPanel && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t('settingsTitle')}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}
        
        {currentPanel ? (
          <SettingPanel title={currentPanel.title} onBack={() => setActiveSetting(null)}>
            {currentPanel.content}
          </SettingPanel>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-y-6 justify-items-center">
              <SettingCircleButton label={t('themeLabel')} icon={<ThemeIcon />} onClick={() => setActiveSetting('theme')} />
              <SettingCircleButton label={t('fontSizeLabel')} icon={<FontIcon />} onClick={() => setActiveSetting('fontSize')} />
              <SettingCircleButton label={t('accentColorLabel')} icon={<ColorIcon />} onClick={() => setActiveSetting('accentColor')} />
              <SettingCircleButton label={t('geminiFeaturesButton')} icon={<FeatureIcon />} onClick={() => setActiveSetting('features')} />
              <SettingCircleButton label={t('aiPersonalityLabel')} icon={<PersonalityIcon />} onClick={() => setActiveSetting('personality')} />
              <SettingCircleButton label={t('appLanguageLabel')} icon={<LanguageIcon />} onClick={() => setActiveSetting('language')} />
            </div>

            <div className="pt-4 border-t border-[--border-color] space-y-1">
                 <button onClick={() => setIsPromoVideoModalOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-black/20 transition-colors flex justify-between items-center text-gray-200">
                    <span className="flex items-center gap-3"><VideoIcon/>{t('promoVideoLabel')}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                 </button>
                 <button onClick={() => setActiveSetting('history')} className="w-full text-left p-3 rounded-lg hover:bg-black/20 transition-colors flex justify-between items-center text-gray-200">
                    <span className="flex items-center gap-3"><HistoryIcon/>{t('historyTitle')}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                 </button>
                 {activeSetting === 'history' && (
                     <div className="p-2 space-y-2">
                         {history.length > 0 ? (<div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-black/20 rounded-lg border border-[--border-color]">{history.map((chat) => (<button key={chat.id} onClick={() => { loadChat(chat.id); onClose(); }} className="w-full text-left p-2.5 rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors"><p className="text-sm font-medium truncate">{chat.title}</p><p className="text-xs text-gray-400">{new Date(chat.timestamp).toLocaleString()}</p></button>))}</div>) : (<p className="text-sm text-gray-400 p-3 text-center bg-black/20 rounded-lg">{t('historyEmpty')}</p>)}
                         {history.length > 0 && (<button onClick={clearHistory} className="w-full mt-2 px-4 py-2 text-sm font-semibold text-red-200 bg-red-900/40 rounded-lg hover:bg-red-900/60 transition-colors">{t('historyClear')}</button>)}
                     </div>
                 )}
                 <button onClick={() => setIsAboutModalOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-black/20 transition-colors flex justify-between items-center">
                    <span className="flex items-center gap-3"><AboutIcon/>{t('aboutAppButton')}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={() => setIsDevInfoModalOpen(true)} className="w-full text-left p-3 rounded-lg hover:bg-black/20 transition-colors flex justify-between items-center">
                    <span className="flex items-center gap-3"><DevInfoIcon/>{t('devInfoButton')}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
            </div>
            
            <div className="pt-4 border-t border-[--border-color] space-y-3">
             <div className="text-sm p-3 bg-black/20 rounded-lg border border-[--border-color]">
                <p><strong>{t('userNameLabel')}:</strong> {user?.name || 'N/A'}</p>
                <p><strong>{t('userEmailLabel')}:</strong> {user?.email || 'N/A'}</p>
             </div>
            <button onClick={onLogout} className="w-full px-4 py-3 font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transition-colors">{t('logoutButton')}</button>
          </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default SettingsScreen;
