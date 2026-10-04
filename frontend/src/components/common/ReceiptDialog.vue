<template>
  <div v-if="sale" class="modal-mask" @click.self="$emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
      <div class="modal-header">
        <h5 id="receipt-title" class="mb-0">Sale receipt</h5>
        <button type="button" class="btn-close" aria-label="Close receipt" @click="$emit('close')"></button>
      </div>
      <div class="modal-body">
        <div ref="receiptRef" class="receipt-sheet">
          <h4>Karibu Groceries LTD</h4>
          <p>{{ sale.branch }} · {{ saleType }}</p>
          <hr />
          <p><strong>Produce:</strong> {{ sale.produceName }} ({{ sale.produceType }})</p>
          <p><strong>Tonnage:</strong> {{ Number(sale.tonnageKg || 0).toLocaleString() }} kg</p>
          <p>
            <strong>Amount:</strong>
            {{ Number(sale.amountPaidUgx || sale.amountDueUgx || 0).toLocaleString('en-UG') }} UGX
          </p>
          <p><strong>Buyer:</strong> {{ sale.buyerName }}</p>
          <p><strong>Agent:</strong> {{ sale.salesAgentName }}</p>
          <p v-if="sale.dueDate"><strong>Due:</strong> {{ formatDate(sale.dueDate) }}</p>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button type="button" class="btn btn-primary" @click="printReceipt">Print</button>
          <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDisplayDate } from '../../utils/dateFormat.js';

export default {
  name: 'ReceiptDialog',
  props: {
    sale: { type: Object, default: null },
    saleType: { type: String, default: 'Cash sale' }
  },
  emits: ['close'],
  methods: {
    formatDate: formatDisplayDate,
    printReceipt() {
      const contents = this.$refs.receiptRef?.innerHTML || '';
      const popup = window.open('', '_blank', 'width=480,height=640');
      if (!popup) return;
      popup.document.write(
        `<html><head><title>Receipt</title></head><body>${contents}<script>window.print();</` +
          `script></body></html>`
      );
      popup.document.close();
    }
  }
};
</script>
