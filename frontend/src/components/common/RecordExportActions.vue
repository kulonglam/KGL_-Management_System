<template>
  <div class="btn-group btn-group-sm" role="group" :aria-label="`Export ${title}`">
    <button type="button" class="btn btn-outline-primary" :disabled="disabled" @click="exportCsv">CSV</button>
    <button type="button" class="btn btn-outline-primary" :disabled="disabled" @click="exportExcel">Excel</button>
    <button type="button" class="btn btn-outline-primary" :disabled="disabled" @click="exportPdf">PDF</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { downloadReportFile } from '../../utils/downloadFile.js';
import { buildTableCsv, buildTableExcel, buildTablePrintHtml } from '../../utils/reports/tableExport.js';

const props = defineProps({
  title: { type: String, required: true },
  filename: { type: String, required: true },
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] }
});

const disabled = computed(() => props.rows.length === 0);
const stampedName = (extension) => `${props.filename}_${new Date().toISOString().slice(0, 10)}.${extension}`;

const exportCsv = () => {
  downloadReportFile({
    filename: stampedName('csv'),
    content: buildTableCsv(props.title, props.columns, props.rows),
    type: 'text/csv;charset=utf-8'
  });
};

const exportExcel = () => {
  downloadReportFile({
    filename: stampedName('xls'),
    content: buildTableExcel(props.title, props.columns, props.rows),
    type: 'application/vnd.ms-excel'
  });
};

const exportPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(buildTablePrintHtml(props.title, props.columns, props.rows));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
};
</script>
