import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from '../locales/pt-BR.json';
import en from '../locales/en.json';

const resources = {
  'pt-BR': {
    translation: ptBR,
  },
  'en': {
    translation: en,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['pt-BR', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator', 'localStorage', 'htmlTag'],
      caches: ['localStorage'],
    },
  })
  .then(() => {
    // Sincronizar locale inicial com o backend
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke('set_locale', { locale: i18n.language }).catch(() => {});
    });
  });

// Sincronizar locale com o backend quando mudar
i18n.on('languageChanged', (lng) => {
  import('@tauri-apps/api/core').then(({ invoke }) => {
    invoke('set_locale', { locale: lng }).catch(() => {});
  });
});

export default i18n;
