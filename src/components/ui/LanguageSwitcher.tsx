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
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {t('common.language')}:
      </span>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <Button
          variant={language === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleLanguageChange('en')}
          className={`px-3 py-1 text-xs ${
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
          className={`px-3 py-1 text-xs ${
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
