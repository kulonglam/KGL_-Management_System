export const LOCALE_STORAGE_KEY = 'kgl.locale';

const STRINGS = {
  en: {},
  lg: {
    Dashboard: 'Ddaala',
    Branches: 'Amatabi',
    'Stock Ops': 'Obugoba',
    Finance: 'Ssente',
    Platform: 'Enkolagana',
    Inbox: 'Obubaka',
    'Audit Log': 'Ebiwandiiko',
    Profile: 'Profilo',
    Inventory: 'Ebibbe',
    Procurement: 'Okugula',
    'Cash Sales': 'Okutunda kashe',
    'Credit Sales': 'Okutunda ku banja',
    'Sales Records': 'Ebiwandiiko by’entunda',
    'Credit Sales Records': 'Ebiwandiiko bya banja',
    'Price Management': 'Ebbeeyi',
    'Procurement Records': 'Ebiwandiiko by’okugula',
    'Trusted Buyers': 'Abaguzi abakkirizibwa',
    Suppliers: 'Abasuubuzi',
    Users: 'Abakozesa',
    Purchasing: 'Amalagiro g’okugula',
    Till: 'Okutunda',
    Group: 'Kampuni',
    Privacy: 'Ebyekyama'
  }
};

export const getLocale = () => {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === 'lg' ? 'lg' : 'en';
  } catch {
    return 'en';
  }
};

export const setLocale = (value) => {
  const locale = value === 'lg' ? 'lg' : 'en';
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* private mode */
  }
  return locale;
};

export const translate = (label, locale = getLocale()) => STRINGS[locale]?.[label] || label;
