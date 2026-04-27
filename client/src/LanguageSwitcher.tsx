import React from 'react';
import { useI18n } from './i18n';

const labels = { en: 'EN', uk: 'UA' } as const;

const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang } = useI18n();

  const toggle = () => setLang(lang === 'en' ? 'uk' : 'en');

  return (
    <button
      className={`lang-switcher ${className || ''}`}
      onClick={toggle}
      title={lang === 'en' ? 'Українська' : 'English'}
    >
      {labels[lang]}
    </button>
  );
};

export default LanguageSwitcher;
