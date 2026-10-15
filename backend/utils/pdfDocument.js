// Minimal PDF 1.4 writer for text documents (invoices, statements) using the
// built-in Helvetica fonts, so no font embedding or third-party dependency is needed.

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

// Advance widths (1/1000 em) for ASCII 32..126 from the standard Helvetica AFM files.
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778,
  722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
  278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
];
const HELVETICA_BOLD_WIDTHS = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778,
  722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333,
  278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584
];

const REPLACEMENTS = {
  '\u2014': '-',
  '\u2013': '-',
  '\u2026': '...',
  '\u00b7': '-',
  '\u2018': "'",
  '\u2019': "'",
  '\u201c': '"',
  '\u201d': '"',
  '\u2192': '->',
  '\u00a0': ' '
};

const toPdfText = (value) =>
  String(value ?? '')
    .replace(/[\u2014\u2013\u2026\u00b7\u2018\u2019\u201c\u201d\u2192\u00a0]/g, (char) => REPLACEMENTS[char])
    .replace(/[^\x20-\x7e]/g, '?');

const escapePdfString = (value) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const measureText = (text, size, bold = false) => {
  const widths = bold ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS;
  let total = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    total += widths[code - 32] ?? 556;
  }
  return (total * size) / 1000;
};

const wrapText = (text, size, bold, maxWidth) => {
  const lines = [];
  for (const paragraph of toPdfText(text).split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureText(candidate, size, bold) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
};

const formatNumber = (value) => (Number.isFinite(value) ? Number(value.toFixed(2)).toString() : '0');

class PdfBuilder {
  constructor({ title = 'Document', margin = 50 } = {}) {
    this.title = toPdfText(title);
    this.margin = margin;
    this.pages = [];
    this.addPage();
  }

  get contentWidth() {
    return PAGE_WIDTH - this.margin * 2;
  }

  addPage() {
    this.current = [];
    this.pages.push(this.current);
    this.cursorY = PAGE_HEIGHT - this.margin;
    return this;
  }

  ensureSpace(height) {
    if (this.cursorY - height < this.margin) this.addPage();
    return this;
  }

  drawText(text, x, y, { size = 10, bold = false, gray = 0 } = {}) {
    const font = bold ? 'F2' : 'F1';
    this.current.push(
      `BT ${formatNumber(gray)} g /${font} ${formatNumber(size)} Tf ${formatNumber(x)} ${formatNumber(y)} Td ` +
        `(${escapePdfString(toPdfText(text))}) Tj ET`
    );
  }

  text(value, { size = 10, bold = false, align = 'left', gray = 0, x, width, lineGap = 4 } = {}) {
    const left = x ?? this.margin;
    const boxWidth = width ?? this.contentWidth - (left - this.margin);
    const lineHeight = size + lineGap;
    for (const line of wrapText(value, size, bold, boxWidth)) {
      this.ensureSpace(lineHeight);
      this.cursorY -= size;
      const lineWidth = measureText(line, size, bold);
      let lineX = left;
      if (align === 'right') lineX = left + boxWidth - lineWidth;
      if (align === 'center') lineX = left + (boxWidth - lineWidth) / 2;
      this.drawText(line, lineX, this.cursorY, { size, bold, gray });
      this.cursorY -= lineGap;
    }
    return this;
  }

  heading(value, size = 18) {
    return this.text(value, { size, bold: true, lineGap: 8 });
  }

  spacer(height = 10) {
    this.cursorY -= height;
    if (this.cursorY < this.margin) this.addPage();
    return this;
  }

  rule({ gray = 0.75, width = 0.5 } = {}) {
    this.ensureSpace(8);
    this.cursorY -= 4;
    this.current.push(
      `${formatNumber(gray)} G ${formatNumber(width)} w ${formatNumber(this.margin)} ${formatNumber(this.cursorY)} m ` +
        `${formatNumber(PAGE_WIDTH - this.margin)} ${formatNumber(this.cursorY)} l S`
    );
    this.cursorY -= 4;
    return this;
  }

  keyValues(pairs, { size = 10, labelWidth = 130 } = {}) {
    for (const [label, value] of pairs) {
      const lines = wrapText(value, size, false, this.contentWidth - labelWidth);
      this.ensureSpace((size + 4) * lines.length);
      const top = this.cursorY;
      this.cursorY -= size;
      this.drawText(label, this.margin, this.cursorY, { size, bold: true });
      this.cursorY = top;
      this.text(value, { size, x: this.margin + labelWidth, width: this.contentWidth - labelWidth });
    }
    return this;
  }

  // columns: [{ label, width (fraction of content width), align }]
  table(columns, rows, { size = 9 } = {}) {
    const widths = columns.map((column) => column.width * this.contentWidth);
    const drawRow = (cells, bold) => {
      const wrapped = cells.map((cell, index) => wrapText(cell, size, bold, widths[index] - 6));
      const lineCount = Math.max(...wrapped.map((lines) => lines.length), 1);
      const rowHeight = lineCount * (size + 3) + 4;
      if (this.cursorY - rowHeight < this.margin) {
        this.addPage();
        if (!bold) drawRow(columns.map((column) => column.label), true);
      }
      const top = this.cursorY;
      let x = this.margin;
      wrapped.forEach((lines, index) => {
        lines.forEach((line, lineIndex) => {
          const y = top - size - lineIndex * (size + 3);
          const lineWidth = measureText(line, size, bold);
          const cellX = columns[index].align === 'right' ? x + widths[index] - 3 - lineWidth : x + 3;
          this.drawText(line, cellX, y, { size, bold });
        });
        x += widths[index];
      });
      this.cursorY = top - rowHeight;
      this.current.push(
        `0.8 G 0.4 w ${formatNumber(this.margin)} ${formatNumber(this.cursorY + 1)} m ` +
          `${formatNumber(PAGE_WIDTH - this.margin)} ${formatNumber(this.cursorY + 1)} l S`
      );
    };
    drawRow(
      columns.map((column) => column.label),
      true
    );
    rows.forEach((row) => drawRow(row.map((cell) => String(cell ?? '')), false));
    return this;
  }

  // Large diagonal text behind the page content, e.g. VOID or CREDIT NOTE.
  watermark(value, { size = 90, gray = 0.88 } = {}) {
    const text = toPdfText(value);
    const angle = Math.PI / 5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const width = measureText(text, size, true);
    const x = PAGE_WIDTH / 2 - (width / 2) * cos;
    const y = PAGE_HEIGHT / 2 - (width / 2) * sin;
    this.current.unshift(
      `BT ${formatNumber(gray)} g /F2 ${size} Tf ${formatNumber(cos)} ${formatNumber(sin)} ` +
        `${formatNumber(-sin)} ${formatNumber(cos)} ${formatNumber(x)} ${formatNumber(y)} Tm ` +
        `(${escapePdfString(text)}) Tj ET`
    );
    return this;
  }

  toBuffer() {
    const objects = [];
    const addObject = (body) => {
      objects.push(body);
      return objects.length;
    };
    const catalogId = addObject(null);
    const pagesId = addObject(null);
    const regularFontId = addObject(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
    );
    const boldFontId = addObject(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
    );
    const pageIds = [];
    const totalPages = this.pages.length;
    this.pages.forEach((commands, index) => {
      const footer =
        `BT 0.45 g /F1 8 Tf ${formatNumber(this.margin)} 25 Td ` +
        `(${escapePdfString(`${this.title} - page ${index + 1} of ${totalPages}`)}) Tj ET`;
      const stream = [...commands, footer].join('\n');
      const contentId = addObject(
        `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`
      );
      pageIds.push(
        addObject(
          `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
            `/Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> ` +
            `/Contents ${contentId} 0 R >>`
        )
      );
    });
    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] =
      `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    const created = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const infoId = addObject(
      `<< /Title (${escapePdfString(this.title)}) /Producer (KGL Management System) /CreationDate (D:${created}Z) >>`
    );

    const chunks = ['%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'];
    const offsets = [];
    let length = Buffer.byteLength(chunks[0], 'latin1');
    objects.forEach((body, index) => {
      offsets.push(length);
      const chunk = `${index + 1} 0 obj\n${body}\nendobj\n`;
      chunks.push(chunk);
      length += Buffer.byteLength(chunk, 'latin1');
    });
    const xref = [
      'xref',
      `0 ${objects.length + 1}`,
      '0000000000 65535 f ',
      ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
      'trailer',
      `<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>`,
      'startxref',
      String(length),
      '%%EOF',
      ''
    ].join('\n');
    chunks.push(xref);
    return Buffer.from(chunks.join(''), 'latin1');
  }
}

const createPdfDocument = (options) => new PdfBuilder(options);

export { createPdfDocument, measureText, wrapText, toPdfText };
