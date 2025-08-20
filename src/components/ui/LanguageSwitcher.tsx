'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from './button';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: 'en' | 'si') => {
    setLanguage(newLanguage);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center sm:text-left">
        {t('common.language')}:
      </span>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto">
        <Button
          variant={language === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleLanguageChange('en')}
          className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-1 text-xs touch-manipulation ${
            language === 'en'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {t('common.english')}
        </Button>
        <Button
          variant={language === 'si' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleLanguageChange('si')}
          className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-1 text-xs touch-manipulation ${
            language === 'si'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {t('common.sinhala')}
        </Button>
      </div>
    </div>
  );
};
