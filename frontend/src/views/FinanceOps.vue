<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Finance &amp; compliance</h2>
      <p class="page-subtitle">
        Cash-up, tax invoices, GL export, write-offs, statements, period close, and retention.
      </p>
    </div>

    <ul class="nav nav-tabs mb-3 flex-wrap">
      <li v-for="tab in tabs" :key="tab.id" class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </li>
    </ul>

    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    <div v-if="success" class="alert alert-success" role="alert">{{ success }}</div>

    <!-- Cash-up -->
    <div v-show="activeTab === 'cashup'" class="card">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 class="mb-0">End-of-day cash-up</h5>
        <button type="button" class="btn btn-primary btn-sm" :disabled="submitting" @click="openCashUp">
          Open / refresh today
        </button>
      </div>
      <div class="card-body">
        <div v-if="activeCashUp" class="mb-4">
          <p class="mb-1">
            <strong>{{ activeCashUp.branch }}</strong> · {{ activeCashUp.businessDate }} ·
            <span class="badge text-bg-secondary">{{ activeCashUp.status }}</span>
          </p>
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <div class="border rounded p-3">
                <div class="text-muted small">System cash</div>
                <strong>{{ formatUgx(activeCashUp.systemTotals?.cashUgx) }}</strong>
              </div>
            </div>
            <div class="col-md-4">
              <div class="border rounded p-3">
                <div class="text-muted small">System MoMo</div>
                <strong>{{ formatUgx(activeCashUp.systemTotals?.momoUgx) }}</strong>
              </div>
            </div>
            <div class="col-md-4">
              <div class="border rounded p-3">
                <div class="text-muted small">System bank</div>
                <strong>{{ formatUgx(activeCashUp.systemTotals?.bankUgx) }}</strong>
              </div>
            </div>
          </div>

          <div v-if="activeCashUp.status === 'open'" class="row g-3">
            <div class="col-md-3">
              <label class="form-label" for="count-cash">Counted cash</label>
              <input id="count-cash" v-model.number="countForm.cashUgx" type="number" min="0" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label" for="count-momo">Counted MoMo</label>
              <input id="count-momo" v-model.number="countForm.momoUgx" type="number" min="0" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label" for="count-bank">Counted bank</label>
              <input id="count-bank" v-model.number="countForm.bankUgx" type="number" min="0" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label" for="variance-note">Variance note</label>
              <input id="variance-note" v-model="countForm.varianceNote" type="text" class="form-control" />
            </div>
            <div class="col-12">
              <button type="button" class="btn btn-success" :disabled="submitting" @click="closeCashUp">
                Close day
              </button>
            </div>
          </div>
          <div v-else class="text-muted">
            Closed with variance {{ formatUgx(activeCashUp.varianceUgx) }}
            <span v-if="activeCashUp.varianceNote"> — {{ activeCashUp.varianceNote }}</span>
          </div>
        </div>

        <h6>Recent sessions</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Branch</th>
                <th>Status</th>
                <th class="text-end">Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in cashUps" :key="row._id">
                <td>
                  <button type="button" class="btn btn-link btn-sm p-0" @click="activeCashUp = row">
                    {{ row.businessDate }}
                  </button>
                </td>
                <td>{{ row.branch }}</td>
                <td>{{ row.status }}</td>
                <td class="text-end">{{ formatUgx(row.varianceUgx) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Invoices -->
    <div v-show="activeTab === 'invoices'" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Tax invoices &amp; credit notes</h5>
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadInvoices">Refresh</button>
      </div>
      <div class="card-body table-responsive">
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>Number</th>
              <th>Type</th>
              <th>Buyer</th>
              <th class="text-end">Gross</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="invoices.length === 0">
              <td colspan="5" class="text-muted">No invoices yet. They are created automatically on cash sales.</td>
            </tr>
            <tr v-for="row in invoices" :key="row._id">
              <td>{{ row.invoiceNumber }}</td>
              <td>{{ row.documentType }}</td>
              <td>{{ row.buyerName }}</td>
              <td class="text-end">{{ formatUgx(row.grossUgx) }}</td>
              <td class="text-end">
                <button type="button" class="btn btn-sm btn-outline-primary me-1" @click="openInvoiceDocument(row._id)">
                  Open
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="downloadInvoicePdf(row)">
                  PDF
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- GL export -->
    <div v-show="activeTab === 'gl'" class="card">
      <div class="card-header"><h5 class="mb-0">GL journal export</h5></div>
      <div class="card-body">
        <div class="row g-3 mb-3">
          <div class="col-md-3">
            <label class="form-label" for="gl-from">From</label>
            <input id="gl-from" v-model="glForm.from" type="date" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="gl-to">To</label>
            <input id="gl-to" v-model="glForm.to" type="date" class="form-control" />
          </div>
          <div class="col-md-6 d-flex align-items-end gap-2">
            <button type="button" class="btn btn-primary" :disabled="submitting" @click="runGlExport">
              Preview
            </button>
            <button type="button" class="btn btn-outline-secondary" :disabled="submitting" @click="downloadGlCsv">
              Download CSV
            </button>
          </div>
        </div>
        <div v-if="glExport">
          <p>
            Lines: {{ glExport.lines?.length || 0 }} · Debit
            {{ formatUgx(glExport.totals?.debitUgx) }} · Credit
            {{ formatUgx(glExport.totals?.creditUgx) }} ·
            <span :class="glExport.totals?.balanced ? 'text-success' : 'text-danger'">
              {{ glExport.totals?.balanced ? 'Balanced' : 'Out of balance' }}
            </span>
          </p>
          <div class="table-responsive" style="max-height: 24rem; overflow: auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Account</th>
                  <th class="text-end">Debit</th>
                  <th class="text-end">Credit</th>
                  <th>Memo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in glExport.lines" :key="idx">
                  <td>{{ String(line.date).slice(0, 10) }}</td>
                  <td>{{ line.account }}</td>
                  <td class="text-end">{{ formatUgx(line.debitUgx) }}</td>
                  <td class="text-end">{{ formatUgx(line.creditUgx) }}</td>
                  <td>{{ line.memo }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Credit write-offs -->
    <div v-show="activeTab === 'writeoffs'" class="card">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 class="mb-0">Credit write-offs</h5>
        <div class="d-flex gap-2 align-items-center">
          <label class="visually-hidden" for="wo-status">Status</label>
          <select id="wo-status" v-model="writeOffStatus" class="form-select form-select-sm" @change="loadWriteOffs">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadWriteOffs">Refresh</button>
        </div>
      </div>
      <div class="card-body table-responsive">
        <p class="text-muted small">
          Managers request write-offs from Credit Sales Records. A director other than the requester must approve.
        </p>
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Branch</th>
              <th>Due</th>
              <th class="text-end">Balance</th>
              <th>Reason</th>
              <th>Requested by</th>
              <th v-if="writeOffStatus !== 'pending'">Decision</th>
              <th v-if="writeOffStatus === 'pending' && isDirector"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="writeOffs.length === 0">
              <td colspan="8" class="text-muted">No {{ writeOffStatus }} write-offs.</td>
            </tr>
            <tr v-for="row in writeOffs" :key="row._id">
              <td>{{ row.buyerName }}</td>
              <td>{{ row.branch }}</td>
              <td>{{ formatDisplayDate(row.dueDate) }}</td>
              <td class="text-end">
                {{ formatUgx(writeOffStatus === 'approved' ? row.writtenOffUgx : row.balanceUgx) }}
              </td>
              <td>{{ row.writeOff?.reason }}</td>
              <td>
                {{ row.writeOff?.requestedBy?.name || '-' }}
                <div class="text-muted small">{{ formatDisplayTimestamp(row.writeOff?.requestedAt) }}</div>
              </td>
              <td v-if="writeOffStatus !== 'pending'">
                {{ row.writeOff?.decidedBy?.name || '-' }}
                <div class="text-muted small">{{ row.writeOff?.decisionNote }}</div>
              </td>
              <td v-if="writeOffStatus === 'pending' && isDirector" class="text-end text-nowrap">
                <button
                  type="button"
                  class="btn btn-sm btn-success me-1"
                  :disabled="submitting || isOwnRequest(row)"
                  :title="isOwnRequest(row) ? 'You requested this write-off; another director must approve.' : ''"
                  @click="decideWriteOff(row, 'approve')"
                >
                  Approve
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="submitting"
                  @click="decideWriteOff(row, 'reject')"
                >
                  Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Period close -->
    <div v-show="activeTab === 'periods'" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Period close</h5>
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadPeriodLocks">Refresh</button>
      </div>
      <div class="card-body">
        <p class="text-muted small">
          Sales, procurement, and credit records dated on or before the lock date can't be created, edited, voided, or
          deleted. "All branches" applies everywhere; a branch lock adds to it.
        </p>
        <div class="table-responsive mb-3">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Scope</th>
                <th>Closed through</th>
                <th>Note</th>
                <th>Updated by</th>
                <th v-if="isDirector"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="periodLocks.length === 0">
                <td :colspan="isDirector ? 5 : 4" class="text-muted">No periods are closed.</td>
              </tr>
              <tr v-for="lock in periodLocks" :key="lock._id">
                <td>{{ lock.scope === 'ALL' ? 'All branches' : lock.scope }}</td>
                <td>
                  <span v-if="lock.lockedThrough">{{ formatDisplayDate(lock.lockedThrough) }}</span>
                  <span v-else class="text-muted">Open</span>
                </td>
                <td>{{ lock.note }}</td>
                <td>{{ lock.updatedBy?.name || '-' }}</td>
                <td v-if="isDirector" class="text-end">
                  <button
                    v-if="lock.lockedThrough"
                    type="button"
                    class="btn btn-sm btn-outline-warning"
                    :disabled="submitting"
                    @click="reopenPeriod(lock)"
                  >
                    Reopen
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="isDirector" class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label" for="lock-scope">Scope</label>
            <select id="lock-scope" v-model="periodForm.scope" class="form-select">
              <option value="ALL">All branches</option>
              <option v-for="name in branchNames" :key="name" :value="name">{{ name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label" for="lock-date">Close books through</label>
            <input id="lock-date" v-model="periodForm.lockedThrough" type="date" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label" for="lock-note">Note</label>
            <input id="lock-note" v-model="periodForm.note" type="text" maxlength="500" class="form-control" />
          </div>
          <div class="col-md-2">
            <button
              type="button"
              class="btn btn-primary w-100"
              :disabled="submitting || !periodForm.lockedThrough"
              @click="savePeriodLock"
            >
              Close period
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer statements -->
    <div v-show="activeTab === 'statements'" class="card">
      <div class="card-header"><h5 class="mb-0">Customer statements</h5></div>
      <div class="card-body">
        <div class="row g-3 mb-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label" for="stmt-buyer">Trusted buyer</label>
            <select id="stmt-buyer" v-model="statementForm.buyerId" class="form-select">
              <option value="" disabled>Select a buyer</option>
              <option v-for="buyer in buyers" :key="buyer._id" :value="buyer._id">
                {{ buyer.name }} · {{ buyer.branch }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label" for="stmt-from">From</label>
            <input id="stmt-from" v-model="statementForm.from" type="date" class="form-control" />
          </div>
          <div class="col-md-2">
            <label class="form-label" for="stmt-to">To</label>
            <input id="stmt-to" v-model="statementForm.to" type="date" class="form-control" />
          </div>
          <div class="col-md-4 d-flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="submitting || !statementForm.buyerId"
              @click="loadStatement"
            >
              View
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="submitting || !statementForm.buyerId"
              @click="downloadStatementPdf"
            >
              PDF
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="submitting || !statementForm.buyerId"
              @click="emailStatement"
            >
              Email
            </button>
          </div>
        </div>

        <div v-if="statement">
          <p class="mb-2">
            <strong>{{ statement.buyer.name }}</strong> · {{ statement.buyer.branch }} ·
            {{ formatDisplayRange(statement.period.from, statement.period.to) }}
            <span v-if="statement.buyer.email" class="text-muted"> · {{ statement.buyer.email }}</span>
          </p>
          <div class="row g-3 mb-3">
            <div class="col-md-3">
              <div class="border rounded p-3">
                <div class="text-muted small">Opening balance</div>
                <strong>{{ formatUgx(statement.openingBalanceUgx) }}</strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3">
                <div class="text-muted small">Charges / credits</div>
                <strong>
                  {{ formatUgx(statement.totals.debitUgx) }} / {{ formatUgx(statement.totals.creditUgx) }}
                </strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3">
                <div class="text-muted small">Closing balance</div>
                <strong>{{ formatUgx(statement.closingBalanceUgx) }}</strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3">
                <div class="text-muted small">Outstanding today</div>
                <strong>{{ formatUgx(statement.currentOutstandingUgx) }}</strong>
              </div>
            </div>
          </div>
          <h6>Aging</h6>
          <div class="table-responsive mb-3">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th v-for="bucket in agingBuckets" :key="bucket.key" class="text-end">{{ bucket.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-for="bucket in agingBuckets" :key="bucket.key" class="text-end">
                    {{ formatUgx(statement.aging?.[bucket.key]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-responsive" style="max-height: 24rem; overflow: auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th class="text-end">Charge</th>
                  <th class="text-end">Credit</th>
                  <th class="text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="statement.lines.length === 0">
                  <td colspan="6" class="text-muted">No activity in this period.</td>
                </tr>
                <tr v-for="(line, idx) in statement.lines" :key="idx">
                  <td>{{ formatDisplayDate(line.date) }}</td>
                  <td>{{ lineTypeLabel(line.type) }}</td>
                  <td>{{ line.description }}</td>
                  <td class="text-end">{{ line.debitUgx ? formatUgx(line.debitUgx) : '' }}</td>
                  <td class="text-end">{{ line.creditUgx ? formatUgx(line.creditUgx) : '' }}</td>
                  <td class="text-end">{{ formatUgx(line.balanceUgx) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Personal-data export (director) -->
    <div v-show="activeTab === 'privacy'" class="card">
      <div class="card-header"><h5 class="mb-0">Personal-data export</h5></div>
      <div class="card-body">
        <p class="text-muted small">
          Download everything held about a trusted buyer or staff account (profile, credit history, messages, audit
          trail) as JSON for a data-subject access request. Every export is audited.
        </p>
        <div class="row g-3 align-items-end mb-3">
          <div class="col-md-6">
            <label class="form-label" for="dsar-buyer">Trusted buyer</label>
            <select id="dsar-buyer" v-model="privacyForm.buyerId" class="form-select">
              <option value="" disabled>Select a buyer</option>
              <option v-for="buyer in buyers" :key="buyer._id" :value="buyer._id">
                {{ buyer.name }} · {{ buyer.branch }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <button
              type="button"
              class="btn btn-outline-primary w-100"
              :disabled="submitting || !privacyForm.buyerId"
              @click="exportPersonalData('buyer')"
            >
              Export buyer data
            </button>
          </div>
        </div>
        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label class="form-label" for="dsar-user">Staff account</label>
            <select id="dsar-user" v-model="privacyForm.userId" class="form-select">
              <option value="" disabled>Select a user</option>
              <option v-for="account in staffUsers" :key="account._id" :value="account._id">
                {{ account.name }} · {{ account.role }}{{ account.branch ? ` · ${account.branch}` : '' }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <button
              type="button"
              class="btn btn-outline-primary w-100"
              :disabled="submitting || !privacyForm.userId"
              @click="exportPersonalData('user')"
            >
              Export user data
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'ledger'" class="card">
      <div class="card-header"><h5 class="mb-0">Posted journal and trial balance</h5></div>
      <div class="card-body">
        <p class="text-muted small">Posts the GL export for the dates above into a stored journal, then shows the trial balance.</p>
        <button v-if="isDirector" type="button" class="btn btn-primary mb-3" :disabled="submitting" @click="postJournal">
          Post journal
        </button>
        <table v-if="trialBalance" class="table table-sm">
          <thead>
            <tr>
              <th>Account</th>
              <th class="text-end">Debit</th>
              <th class="text-end">Credit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in trialBalance.accounts" :key="row.account">
              <td>{{ row.account }}</td>
              <td class="text-end">{{ formatUgx(row.debitUgx) }}</td>
              <td class="text-end">{{ formatUgx(row.creditUgx) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-show="activeTab === 'aging'" class="card">
      <div class="card-header"><h5 class="mb-0">Receivables aging</h5></div>
      <div class="card-body">
        <button type="button" class="btn btn-outline-secondary btn-sm mb-3" @click="loadAging">Refresh</button>
        <table v-if="aging" class="table table-sm">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Branch</th>
              <th class="text-end">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in aging.buyers" :key="row.trustedBuyerId || row.buyerName">
              <td>{{ row.buyerName }}</td>
              <td>{{ row.branch }}</td>
              <td class="text-end">{{ formatUgx(row.balanceUgx) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="aging" class="mb-0">Total outstanding {{ formatUgx(aging.totalUgx) }} as of {{ aging.asOf }}.</p>
      </div>
    </div>

    <div v-show="activeTab === 'bank'" class="card">
      <div class="card-header"><h5 class="mb-0">Bank reconciliation</h5></div>
      <div class="card-body">
        <label class="form-label" for="bank-csv">Lines as date,description,amount,in or out</label>
        <textarea id="bank-csv" v-model="bankCsv" class="form-control mb-2" rows="4" placeholder="2026-10-17,Shop deposit,50000,in"></textarea>
        <button type="button" class="btn btn-primary btn-sm mb-3" :disabled="submitting" @click="importBank">Import</button>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th class="text-end">Amount</th>
              <th>Match</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in bankLines" :key="line._id">
              <td>{{ line.statementDate }}</td>
              <td>{{ line.description }}</td>
              <td class="text-end">{{ line.direction }} {{ formatUgx(line.amountUgx) }}</td>
              <td>
                <span v-if="line.matchedRefId">Matched</span>
                <button
                  v-else-if="line.suggestions?.length"
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  @click="matchBank(line, line.suggestions[0])"
                >
                  Match {{ line.suggestions[0].label }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tax config (director) -->
    <div v-show="activeTab === 'tax'" class="card">
      <div class="card-header"><h5 class="mb-0">Tax configuration</h5></div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="tax-company">Company name</label>
            <input id="tax-company" v-model="taxForm.companyName" class="form-control" :disabled="!isDirector" />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="tax-tin">TIN</label>
            <input id="tax-tin" v-model="taxForm.tin" class="form-control" :disabled="!isDirector" />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="tax-vat">VAT %</label>
            <input
              id="tax-vat"
              v-model.number="taxForm.vatRatePercent"
              type="number"
              min="0"
              max="100"
              class="form-control"
              :disabled="!isDirector"
            />
          </div>
          <div class="col-12">
            <label class="form-label" for="tax-preamble">Invoice preamble</label>
            <textarea
              id="tax-preamble"
              v-model="taxForm.invoicePreamble"
              class="form-control"
              rows="2"
              :disabled="!isDirector"
            ></textarea>
          </div>
          <div v-if="isDirector" class="col-12">
            <button type="button" class="btn btn-primary" :disabled="submitting" @click="saveTaxConfig">
              Save tax config
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Retention (director) -->
    <div v-show="activeTab === 'retention'" class="card">
      <div class="card-header"><h5 class="mb-0">Data retention</h5></div>
      <div class="card-body">
        <div class="row g-3 mb-3">
          <div class="col-md-3">
            <label class="form-label" for="ret-audit">Audit log days</label>
            <input id="ret-audit" v-model.number="retentionForm.auditLogDays" type="number" min="30" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="ret-msg">Message days</label>
            <input
              id="ret-msg"
              v-model.number="retentionForm.messageOutboxDays"
              type="number"
              min="30"
              class="form-control"
            />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="ret-note">Notification days</label>
            <input
              id="ret-note"
              v-model.number="retentionForm.stockNotificationDays"
              type="number"
              min="30"
              class="form-control"
            />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="ret-anon">Anonymize buyer after (days)</label>
            <input
              id="ret-anon"
              v-model.number="retentionForm.anonymizeBuyerAfterDays"
              type="number"
              min="30"
              class="form-control"
            />
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-primary" :disabled="submitting" @click="saveRetention">
            Save policy
          </button>
          <button type="button" class="btn btn-outline-danger" :disabled="submitting" @click="runRetention">
            Run retention job
          </button>
          <button type="button" class="btn btn-outline-secondary" @click="downloadAuditPack">
            Download audit pack (ZIP)
          </button>
        </div>
        <p v-if="retentionForm.lastRunAt" class="text-muted mt-3 mb-0">
          Last run: {{ formatDisplayTimestamp(retentionForm.lastRunAt) }}
          <span v-if="retentionForm.lastRunSummary">
            — deleted audit {{ retentionForm.lastRunSummary.auditLogsDeleted }}, messages
            {{ retentionForm.lastRunSummary.messagesDeleted }}, anonymized
            {{ retentionForm.lastRunSummary.buyersAnonymized }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { authAPI, branchAPI, financeAPI, trustedBuyersAPI } from '../services/api';
import { asListPayload } from '../utils/listPayload.js';
import { formatUgx } from '../utils/numberFormat.js';
import { isDirector } from '../utils/directorAccess.js';
import { downloadReportFile } from '../utils/downloadFile.js';
import { businessTodayIso, shiftDateKey } from '../utils/businessTime.js';
import { formatDisplayDate, formatDisplayRange, formatDisplayTimestamp } from '../utils/dateFormat.js';

const AGING_BUCKETS = [
  { key: 'current', label: 'Not yet due' },
  { key: 'days1to30', label: '1-30 days' },
  { key: 'days31to60', label: '31-60 days' },
  { key: 'days61to90', label: '61-90 days' },
  { key: 'over90', label: '90+ days' }
];

const LINE_TYPE_LABELS = { dispatch: 'Dispatch', payment: 'Payment', write_off: 'Write-off' };

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

export default {
  name: 'FinanceOps',
  data() {
    const today = businessTodayIso();
    return {
      agingBuckets: AGING_BUCKETS,
      writeOffStatus: 'pending',
      writeOffs: [],
      periodLocks: [],
      branchNames: [],
      periodForm: { scope: 'ALL', lockedThrough: '', note: '' },
      buyers: [],
      statementForm: { buyerId: '', from: shiftDateKey(today, -90), to: today },
      statement: null,
      aging: null,
      trialBalance: null,
      bankLines: [],
      bankCsv: '',
      staffUsers: [],
      privacyForm: { buyerId: '', userId: '' },
      activeTab: 'cashup',
      error: '',
      success: '',
      submitting: false,
      cashUps: [],
      activeCashUp: null,
      countForm: { cashUgx: 0, momoUgx: 0, bankUgx: 0, varianceNote: '' },
      invoices: [],
      glForm: { from: today, to: today },
      glExport: null,
      taxForm: {
        companyName: '',
        tin: '',
        vatRatePercent: 18,
        invoicePreamble: ''
      },
      retentionForm: {
        auditLogDays: 2555,
        messageOutboxDays: 365,
        stockNotificationDays: 180,
        anonymizeBuyerAfterDays: 2555,
        lastRunAt: null,
        lastRunSummary: null
      }
    };
  },
  computed: {
    ...mapState(useAuthStore, ['user']),
    isDirector() {
      return isDirector(this.user);
    },
    tabs() {
      const tabs = [
        { id: 'cashup', label: 'Cash-up' },
        { id: 'invoices', label: 'Invoices' },
        { id: 'gl', label: 'GL export' },
        { id: 'ledger', label: 'Ledger' },
        { id: 'aging', label: 'Receivables' },
        { id: 'bank', label: 'Bank' },
        { id: 'writeoffs', label: 'Write-offs' },
        { id: 'statements', label: 'Statements' },
        { id: 'periods', label: 'Period close' },
        { id: 'tax', label: 'Tax config' }
      ];
      if (this.isDirector) {
        tabs.push({ id: 'retention', label: 'Retention' }, { id: 'privacy', label: 'Privacy' });
      }
      return tabs;
    }
  },
  watch: {
    activeTab(tab) {
      this.error = '';
      this.success = '';
      if (tab === 'cashup') this.loadCashUps();
      if (tab === 'invoices') this.loadInvoices();
      if (tab === 'writeoffs') this.loadWriteOffs();
      if (tab === 'aging') this.loadAging();
      if (tab === 'bank') this.loadBankLines();
      if (tab === 'statements' && this.buyers.length === 0) this.loadBuyers();
      if (tab === 'periods') this.loadPeriodLocks();
      if (tab === 'tax') this.loadTaxConfig();
      if (tab === 'retention') this.loadRetention();
      if (tab === 'privacy') this.loadPrivacyOptions();
    }
  },
  mounted() {
    this.loadCashUps();
  },
  methods: {
    formatUgx,
    formatDisplayDate,
    formatDisplayRange,
    formatDisplayTimestamp,
    lineTypeLabel(type) {
      return LINE_TYPE_LABELS[type] || type;
    },
    isOwnRequest(row) {
      const requester = row.writeOff?.requestedBy;
      const requesterId = requester?._id || requester;
      return Boolean(requesterId && this.user?._id && String(requesterId) === String(this.user._id));
    },
    async loadWriteOffs() {
      try {
        const response = await financeAPI.listWriteOffs({ status: this.writeOffStatus });
        this.writeOffs = Array.isArray(response.data) ? response.data : asListPayload(response.data).items;
      } catch (err) {
        this.error = errorMessage(err, 'Failed to load write-offs.');
      }
    },
    async decideWriteOff(row, decision) {
      const verb = decision === 'approve' ? 'Approve' : 'Reject';
      const note = window.prompt(`${verb} write-off for ${row.buyerName}? Optional note:`, '');
      if (note === null) return;
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        if (decision === 'approve') {
          await financeAPI.approveWriteOff(row._id, { note });
          this.success = `Wrote off ${formatUgx(row.balanceUgx)} for ${row.buyerName}.`;
        } else {
          await financeAPI.rejectWriteOff(row._id, { note });
          this.success = `Write-off request for ${row.buyerName} rejected.`;
        }
        await this.loadWriteOffs();
      } catch (err) {
        this.error = errorMessage(err, `Failed to ${decision} write-off.`);
      } finally {
        this.submitting = false;
      }
    },
    async loadPeriodLocks() {
      try {
        const [locksResponse, branchesResponse] = await Promise.all([
          financeAPI.listPeriodLocks(),
          this.isDirector && this.branchNames.length === 0 ? branchAPI.list() : Promise.resolve(null)
        ]);
        this.periodLocks = Array.isArray(locksResponse.data) ? locksResponse.data : [];
        if (branchesResponse) {
          this.branchNames = Array.isArray(branchesResponse.data?.names) ? branchesResponse.data.names : [];
        }
      } catch (err) {
        this.error = errorMessage(err, 'Failed to load period locks.');
      }
    },
    async applyPeriodLock(payload, successMessage) {
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        await financeAPI.setPeriodLock(payload);
        this.success = successMessage;
        await this.loadPeriodLocks();
      } catch (err) {
        this.error = errorMessage(err, 'Failed to update period lock.');
      } finally {
        this.submitting = false;
      }
    },
    async savePeriodLock() {
      const { scope, lockedThrough, note } = this.periodForm;
      const label = scope === 'ALL' ? 'all branches' : scope;
      if (!window.confirm(`Close the books for ${label} through ${formatDisplayDate(lockedThrough)}?`)) return;
      await this.applyPeriodLock({ scope, lockedThrough, note }, `Books closed for ${label} through ${formatDisplayDate(lockedThrough)}.`);
      this.periodForm = { ...this.periodForm, note: '' };
    },
    async reopenPeriod(lock) {
      const label = lock.scope === 'ALL' ? 'all branches' : lock.scope;
      const note = window.prompt(`Reopen the books for ${label}? Give a reason:`, '');
      if (note === null) return;
      await this.applyPeriodLock({ scope: lock.scope, lockedThrough: null, note }, `Books reopened for ${label}.`);
    },
    async loadBuyers() {
      try {
        const response = await trustedBuyersAPI.getAll({ sort: 'name_asc' });
        this.buyers = Array.isArray(response.data) ? response.data : asListPayload(response.data).items;
      } catch (err) {
        this.error = errorMessage(err, 'Failed to load trusted buyers.');
      }
    },
    statementParams() {
      return { from: this.statementForm.from, to: this.statementForm.to };
    },
    async loadStatement() {
      this.submitting = true;
      this.error = '';
      try {
        const response = await financeAPI.getStatement(this.statementForm.buyerId, this.statementParams());
        this.statement = response.data;
      } catch (err) {
        this.error = errorMessage(err, 'Failed to load statement.');
      } finally {
        this.submitting = false;
      }
    },
    async downloadStatementPdf() {
      this.submitting = true;
      this.error = '';
      try {
        const response = await financeAPI.getStatementPdf(this.statementForm.buyerId, this.statementParams());
        const buyer = this.buyers.find((row) => row._id === this.statementForm.buyerId);
        const name = String(buyer?.name || 'buyer').replace(/[^\w.-]+/g, '_');
        downloadReportFile({
          filename: `statement_${name}_${this.statementForm.to}.pdf`,
          content: response.data,
          type: 'application/pdf'
        });
      } catch (err) {
        this.error = errorMessage(err, 'Failed to download statement PDF.');
      } finally {
        this.submitting = false;
      }
    },
    async emailStatement() {
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        const response = await financeAPI.emailStatement(this.statementForm.buyerId, this.statementParams());
        this.success = `Statement queued for ${response.data.to}.`;
      } catch (err) {
        this.error = errorMessage(err, 'Failed to email statement.');
      } finally {
        this.submitting = false;
      }
    },
    async loadPrivacyOptions() {
      const tasks = [];
      if (this.buyers.length === 0) tasks.push(this.loadBuyers());
      if (this.staffUsers.length === 0) {
        tasks.push(
          authAPI
            .listUsers({ sort: 'name_asc' })
            .then((response) => {
              this.staffUsers = Array.isArray(response.data) ? response.data : asListPayload(response.data).items;
            })
            .catch((err) => {
              this.error = errorMessage(err, 'Failed to load users.');
            })
        );
      }
      await Promise.all(tasks);
    },
    async exportPersonalData(kind) {
      const id = kind === 'buyer' ? this.privacyForm.buyerId : this.privacyForm.userId;
      if (!id) return;
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        const response =
          kind === 'buyer' ? await financeAPI.exportBuyerData(id) : await financeAPI.exportUserData(id);
        downloadReportFile({
          filename: `personal-data_${kind}_${id}_${businessTodayIso()}.json`,
          content: JSON.stringify(response.data, null, 2),
          type: 'application/json;charset=utf-8'
        });
        this.success = 'Personal-data export downloaded. Store it securely and delete it once delivered.';
      } catch (err) {
        this.error = errorMessage(err, 'Personal-data export failed.');
      } finally {
        this.submitting = false;
      }
    },
    async loadAging() {
      try {
        const response = await financeAPI.getAging();
        this.aging = response.data;
      } catch (err) {
        this.error = errorMessage(err, 'Failed to load receivables aging.');
      }
    },
    async postJournal() {
      this.submitting = true;
      this.error = '';
      try {
        await financeAPI.postJournal({ from: this.glForm.from, to: this.glForm.to });
        const response = await financeAPI.trialBalance({ from: this.glForm.from, to: this.glForm.to });
        this.trialBalance = response.data;
        this.success = this.trialBalance.totals.balanced ? 'Journal posted and balanced.' : 'Journal posted, out of balance.';
      } catch (err) {
        this.error = errorMessage(err, 'Failed to post the journal.');
      } finally {
        this.submitting = false;
      }
    },
    async loadBankLines() {
      try {
        const response = await financeAPI.listBankLines();
        this.bankLines = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.error = errorMessage(err, 'Failed to load bank lines.');
      }
    },
    async importBank() {
      const lines = this.bankCsv
        .split('\n')
        .map((row) => row.trim())
        .filter(Boolean)
        .map((row) => {
          const [statementDate, description, amountUgx, direction] = row.split(',').map((part) => part.trim());
          return { statementDate, description, amountUgx: Number(amountUgx), direction };
        });
      this.submitting = true;
      this.error = '';
      try {
        await financeAPI.importBankLines({ lines });
        this.bankCsv = '';
        this.success = 'Statement lines imported.';
        await this.loadBankLines();
      } catch (err) {
        this.error = errorMessage(err, 'Failed to import the statement.');
      } finally {
        this.submitting = false;
      }
    },
    async matchBank(line, suggestion) {
      try {
        await financeAPI.matchBankLine(line._id, { refType: suggestion.refType, refId: suggestion.refId });
        await this.loadBankLines();
      } catch (err) {
        this.error = errorMessage(err, 'Failed to match the bank line.');
      }
    },
    async openInvoiceDocument(id) {
      try {
        const response = await financeAPI.getInvoiceDocument(id);
        const blob = new Blob([response.data], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to open invoice document.';
      }
    },
    async downloadInvoicePdf(row) {
      try {
        const response = await financeAPI.getInvoicePdf(row._id);
        downloadReportFile({
          filename: `${String(row.invoiceNumber).replace(/[^\w.-]+/g, '_')}.pdf`,
          content: response.data,
          type: 'application/pdf'
        });
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to download invoice PDF.';
      }
    },
    async loadCashUps() {
      try {
        const response = await financeAPI.listCashUps();
        this.cashUps = Array.isArray(response.data) ? response.data : asListPayload(response.data).items;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load cash-up sessions.';
      }
    },
    async openCashUp() {
      this.submitting = true;
      this.error = '';
      try {
        const response = await financeAPI.openCashUp({
          businessDate: businessTodayIso(),
          branch: this.user.branch
        });
        this.activeCashUp = response.data;
        this.countForm = {
          cashUgx: response.data.systemTotals?.cashUgx || 0,
          momoUgx: response.data.systemTotals?.momoUgx || 0,
          bankUgx: response.data.systemTotals?.bankUgx || 0,
          varianceNote: ''
        };
        this.success = 'Cash-up session ready.';
        await this.loadCashUps();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to open cash-up.';
      } finally {
        this.submitting = false;
      }
    },
    async closeCashUp() {
      if (!this.activeCashUp) return;
      this.submitting = true;
      this.error = '';
      try {
        const response = await financeAPI.closeCashUp(this.activeCashUp._id, {
          countedTotals: {
            cashUgx: this.countForm.cashUgx,
            momoUgx: this.countForm.momoUgx,
            bankUgx: this.countForm.bankUgx
          },
          varianceNote: this.countForm.varianceNote
        });
        this.activeCashUp = response.data;
        this.success = 'Day closed.';
        await this.loadCashUps();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to close cash-up.';
      } finally {
        this.submitting = false;
      }
    },
    async loadInvoices() {
      try {
        const response = await financeAPI.listInvoices({ page: 1, limit: 50 });
        this.invoices = asListPayload(response.data).items;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load invoices.';
      }
    },
    async runGlExport() {
      this.submitting = true;
      this.error = '';
      try {
        const response = await financeAPI.glExport({
          from: this.glForm.from,
          to: this.glForm.to
        });
        this.glExport = response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'GL export failed.';
      } finally {
        this.submitting = false;
      }
    },
    async downloadGlCsv() {
      this.submitting = true;
      this.error = '';
      try {
        const response = await financeAPI.glExport({
          from: this.glForm.from,
          to: this.glForm.to,
          format: 'csv'
        });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'gl-export.csv';
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        this.error = err.response?.data?.message || 'CSV download failed.';
      } finally {
        this.submitting = false;
      }
    },
    async loadTaxConfig() {
      try {
        const response = await financeAPI.getTaxConfig();
        this.taxForm = {
          companyName: response.data.companyName || '',
          tin: response.data.tin || '',
          vatRatePercent: response.data.vatRatePercent ?? 18,
          invoicePreamble: response.data.invoicePreamble || ''
        };
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load tax config.';
      }
    },
    async saveTaxConfig() {
      this.submitting = true;
      this.error = '';
      try {
        await financeAPI.updateTaxConfig(this.taxForm);
        this.success = 'Tax configuration saved. Applies to new invoices only.';
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save tax config.';
      } finally {
        this.submitting = false;
      }
    },
    async loadRetention() {
      try {
        const response = await financeAPI.getRetention();
        this.retentionForm = {
          auditLogDays: response.data.auditLogDays,
          messageOutboxDays: response.data.messageOutboxDays,
          stockNotificationDays: response.data.stockNotificationDays,
          anonymizeBuyerAfterDays: response.data.anonymizeBuyerAfterDays,
          lastRunAt: response.data.lastRunAt,
          lastRunSummary: response.data.lastRunSummary
        };
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load retention policy.';
      }
    },
    async saveRetention() {
      this.submitting = true;
      this.error = '';
      try {
        const response = await financeAPI.updateRetention(this.retentionForm);
        this.retentionForm = { ...this.retentionForm, ...response.data };
        this.success = 'Retention policy saved.';
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save retention policy.';
      } finally {
        this.submitting = false;
      }
    },
    async runRetention() {
      this.submitting = true;
      this.error = '';
      try {
        const response = await financeAPI.runRetention();
        this.retentionForm.lastRunAt = response.data.summary?.ranAt;
        this.retentionForm.lastRunSummary = response.data.summary;
        this.success = 'Retention job completed.';
      } catch (err) {
        this.error = err.response?.data?.message || 'Retention job failed.';
      } finally {
        this.submitting = false;
      }
    },
    async downloadAuditPack() {
      try {
        const response = await financeAPI.downloadAuditPack({
          from: this.glForm.from,
          to: this.glForm.to
        });
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = 'audit-pack.zip';
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      } catch {
        this.error = 'Failed to download audit pack.';
      }
    }
  }
};
</script>
