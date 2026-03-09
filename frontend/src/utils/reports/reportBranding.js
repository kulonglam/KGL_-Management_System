const COMPANY_NAME = 'Karibu Groceries LTD';
const SYSTEM_NAME = 'Wholesale Produce Management System';

const getReportLogoUrl = () => {
  if (typeof document === 'undefined' || typeof document.querySelector !== 'function') {
    return '';
  }

  const logoElement = document.querySelector('.app-brand-logo');
  if (!logoElement) return '';

  const explicitSrc =
    typeof logoElement.getAttribute === 'function' ? logoElement.getAttribute('src') : '';
  return String(explicitSrc || logoElement.src || '').trim();
};

const getReportBrandingRows = (reportTitle, generatedAt) => [
  [COMPANY_NAME],
  [SYSTEM_NAME],
  [reportTitle],
  ['Generated At', generatedAt],
  []
];

const buildReportBrandingHtml = ({ reportTitle, generatedAt, escapeHtml }) => {
  const logoUrl = getReportLogoUrl();
  const logoMarkup = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(COMPANY_NAME)} logo" class="report-brand-logo" />`
    : '';

  return `
    <header class="report-branding">
      <div class="report-branding-main">
        ${logoMarkup}
        <div class="report-branding-copy">
          <div class="report-company-name">${escapeHtml(COMPANY_NAME)}</div>
          <div class="report-system-name">${escapeHtml(SYSTEM_NAME)}</div>
          <div class="report-title">${escapeHtml(reportTitle)}</div>
        </div>
      </div>
      <p class="report-generated-at">Generated ${escapeHtml(generatedAt)}</p>
    </header>
  `;
};

export { COMPANY_NAME, SYSTEM_NAME, getReportBrandingRows, buildReportBrandingHtml };
