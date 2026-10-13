const DETAIL_LABELS = [
  ['produceName', 'Produce'],
  ['produceType', 'Type'],
  ['tonnageKg', 'Kilograms'],
  ['buyerName', 'Buyer'],
  ['dealerName', 'Dealer'],
  ['amountPaidUgx', 'Amount paid'],
  ['amountDueUgx', 'Amount due'],
  ['balanceUgx', 'Balance'],
  ['costUgx', 'Cost'],
  ['sellingPrice', 'Selling price'],
  ['repaymentAmountUgx', 'Repayment']
];

const isBlank = (value) => value === undefined || value === null || value === '';

const formatDetailValue = (key, value) => {
  if (key === 'tonnageKg') {
    return `${Number(value).toLocaleString('en-UG')} kg`;
  }
  if (key.endsWith('Ugx') || key === 'sellingPrice') {
    return `${Number(value).toLocaleString('en-UG')} UGX`;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
};

export const formatAuditDetails = (metadata) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return '';
  }

  const lines = [];
  const used = new Set();
  for (const [key, label] of DETAIL_LABELS) {
    if (isBlank(metadata[key])) continue;
    used.add(key);
    lines.push(`${label}: ${formatDetailValue(key, metadata[key])}`);
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (used.has(key) || isBlank(value)) continue;
    lines.push(`${key}: ${formatDetailValue(key, value)}`);
  }

  return lines.join('\n');
};
