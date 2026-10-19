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
    Privacy: 'Ebyekyama',
    'Produce Name': 'Erinnya ly’ebibala',
    'Tonnage (kg)': 'Obuzito (kg)',
    'Amount Paid (UGX)': 'Ssente eziweereddwa (UGX)',
    'Buyer Name': 'Erinnya ly’omuguzi',
    'Payment method': 'Engeri y’okusasula',
    'Amount tendered (UGX)': 'Ssente ezireeteddwa (UGX)',
    Date: 'Ennaku',
    Time: 'Essaawa',
    'New order': 'Okulagira okupya',
    Supplier: 'Omusuubuzi',
    Produce: 'Ebibala',
    Type: 'Ekika',
    'Unit cost': 'Bbeeyi ya kiro',
    'Create draft': 'Tandika okulagira',
    Orders: 'Amalagiro',
    Approve: 'Kkiriza',
    Receive: 'Funa',
    Match: 'Gerageranya',
    Scan: 'Kebera',
    Add: 'Yongera',
    'Take payment': 'Funa ssente',
    'Buyer name': 'Erinnya ly’omuguzi',
    Companies: 'Kkampuni',
    'Add company': 'Yongera kkampuni',
    Totals: 'Omuwendo',
    'Period close': 'Okuggalawo ekiseera',
    'Posted journal and trial balance': 'Ebitabo ebiteekeddwa',
    'Bank reconciliation': 'Okutunuulira bbanka',
    'Customer statements': 'Ripoota z’abaguzi',
    'Goods received and stock updated.': 'Ebibala bifuniddwa era ebitabo by’obubonero bikyusiddwa.',
    'Draft order created. A different person must approve it.': 'Okulagira kutandise. Omuntu omulala ateekwa okukkiriza.',
    'Sale recorded.': 'Entunda ewandiikiddwa.',
    'Saved on this device until the network returns.': 'Kitereddwa ku kyuma kino okutuusa netiwaya lw’edda.',
    Online: 'Ku mutimbagano',
    Offline: 'Teri mutimbagano',
    'Barcode catalog saved on this device.': 'Baakoodi zitereddwa ku kyuma kino.',
    'Purchase orders, goods receipts, and the match against stock.':
      'Amalagiro g’okugula, okufuna ebibala, n’okugerageranya n’obubonero.',
    'Purchase orders, goods receipts, and deliveries that arrive with no order.':
      'Amalagiro g’okugula, okufuna ebibala, n’ebibala ebitajja na kulagira.',
    'Approve draft purchase orders from the branch managers.':
      'Kkiriza amalagiro agatandikiddwa abakungu b’amatabi.',
    'Goods with no order': 'Ebibala ebitali na kulagira',
    'Receive into stock': 'Funa mu bubonero',
    'Receive goods': 'Funa ebibala',
    'Sale receipt': 'Risiti y’entunda',
    Tonnage: 'Obuzito',
    Amount: 'Ssente',
    Buyer: 'Omuguzi',
    Agent: 'Omuntu eyatunda',
    Due: 'Olunaku olukkirizibwa',
    Print: 'Fulumya',
    Close: 'Ggalawo',
    'Back office': 'Ofiisi ey’emabega',
    Payroll: 'Empeera',
    Payables: 'Ebbanja ery’abasuubuzi',
    Warehouse: 'Ewanika',
    Weighbridge: 'Ekyenjuba',
    Assets: 'Eby’obugagga',
    Fleet: 'Ebidduka',
    Budgets: 'Enteekateeka y’ensimbi',
    'Buyer portal': 'Oluggi lw’omuguzi',
    'Restore drill': 'Okugezesa okuzza ebitabo',
    'Run payroll': 'Bala empeera',
    'Save employee': 'Tereka omukozi',
    'Record payment': 'Wandika okusasula',
    'Buyer statement portal': 'Ripoota y’omuguzi'
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
