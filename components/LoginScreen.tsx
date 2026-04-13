import React, { useState } from 'react';
import { User } from '../types';
import { useLocalization } from '../hooks/useLocalization';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex flex-col items-center justify-center ${className}`}>
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-white">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"/>
            <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="8"/>
            <circle cx="67" cy="35" r="4" fill="currentColor"/>
        </svg>
        <span className="text-3xl font-bold tracking-[0.2em] text-white mt-4">ONDEEP</span>
    </div>
);

const GraphicBackground: React.FC = () => (
    <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
    </div>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocalization();
  
  const USERS_KEY = 'ondeep-ai-users';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const storedUsers = localStorage.getItem(USERS_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError(t('loginErrorPasswordMatch'));
        return;
      }
       if (name.trim().length < 2) {
        setError(t('loginErrorFullName'));
        return;
      }
      if (users.find((user: any) => user.email.toLowerCase() === email.toLowerCase())) {
        setError(t('loginErrorExists'));
        return;
      }
      const newUser = { name, email, password };
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
      onLogin({ name, email });
    } else {
      const user = users.find((user: any) => user.email.toLowerCase() === email.toLowerCase() && user.password === password);
      if (user) {
        onLogin({ name: user.name, email: user.email });
      } else {
        setError(t('loginErrorIncorrect'));
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <GraphicBackground />
      <div className="w-full max-w-md p-8 space-y-6 bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-10">
        <div className="text-center">
            <Logo />
            <p className="mt-4 text-gray-400">{t('loginSubtitle')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-center text-white pb-2">
              {isSignUp ? t('loginCreateAccount') : t('loginWelcome')}
            </h2>
            
            {isSignUp && (
              <input
                type="text"
                placeholder={t('loginFullName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-white bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white placeholder:text-gray-400"
                required
              />
            )}
            
            <input
              type="email"
              placeholder={t('loginEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-white bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white placeholder:text-gray-400"
              required
            />
            
            <input
              type="password"
              placeholder={t('loginPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-white bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white placeholder:text-gray-400"
              required
            />

            {isSignUp && (
              <input
                type="password"
                placeholder={t('loginConfirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 text-white bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white placeholder:text-gray-400"
                required
              />
            )}

            {error && (
              <p className="text-sm text-center text-red-400">{error}</p>
            )}

            <button
                type="submit"
                className="w-full px-4 py-3 font-bold text-black bg-white rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-black transition-colors"
            >
                {isSignUp ? t('loginCreate') : t('loginContinue')}
            </button>
        </form>

        <div className="text-center">
            <button
                onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                }}
                className="text-sm text-gray-400 hover:text-white hover:underline"
            >
                {isSignUp ? t('loginToggleLogin') : t('loginToggleSignUp')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;