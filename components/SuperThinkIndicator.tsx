import React, { useState, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { TranslationKey } from '../hooks/useLocalization';

const SuperThinkIndicator: React.FC = () => {
  const { t } = useLocalization();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TranslationKey[] = [
    'superThinkStep1',
    'superThinkStep2',
    'superThinkStep3',
    'superThinkStep4',
    'superThinkStep5',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => (prevStep + 1) % steps.length);
    }, 2000); // Change step every 2 seconds

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="w-64 p-3">
      <h3 className="text-sm font-semibold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[--color-accent] to-purple-500">
        {t('superThinkTitle')}
      </h3>
      <div className="relative w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full bg-[--color-accent] animate-stripes"
          style={{
            width: '100%',
            backgroundSize: '20px 20px',
            backgroundImage: `repeating-linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.2) 0,
              rgba(255, 255, 255, 0.2) 5px,
              transparent 5px,
              transparent 10px
            )`,
          }}
        />
      </div>
      <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400 min-h-[1.25rem]">
        {t(steps[currentStep])}
      </p>
      <style>{`
        @keyframes stripes {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }
        .animate-stripes {
          animation: stripes 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SuperThinkIndicator;
