<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">{{ $t('Back office') }}</h2>
      <p class="page-subtitle">{{ $t('Payroll, supplier bills, warehouse locations, fleet, assets, and budgets.') }}</p>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div class="btn-group mb-3 flex-wrap" role="tablist">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        class="btn btn-sm"
        :class="active === section.id ? 'btn-success' : 'btn-outline-success'"
        @click="openSection(section.id)"
      >
        {{ $t(section.label) }}
      </button>
    </div>

    <section v-if="active === 'payroll'" class="card mb-3">
      <div class="card-body">
        <form class="row g-2 mb-3" @submit.prevent="saveEmployee">
          <div class="col-md-3"><input v-model.trim="employee.name" class="form-control" placeholder="Name" required /></div>
          <div class="col-md-2"><input v-model.trim="employee.branch" class="form-control" placeholder="Branch" /></div>
          <div class="col-md-2"><input v-model.trim="employee.jobTitle" class="form-control" placeholder="Job title" /></div>
          <div class="col-md-2"><input v-model.trim="employee.contact" class="form-control" placeholder="Phone" /></div>
          <div class="col-md-2"><input v-model.number="employee.grossSalaryUgx" type="number" min="0" class="form-control" placeholder="Gross UGX" required /></div>
          <div class="col-md-1"><button class="btn btn-success w-100" type="submit">{{ $t('Save employee') }}</button></div>
        </form>
        <form class="row g-2 mb-3" @submit.prevent="saveAttendance">
          <div class="col-md-4">
            <select v-model="attendance.employeeId" class="form-select" required>
              <option value="" disabled>Employee</option>
              <option v-for="row in employees" :key="row._id" :value="row._id">{{ row.name }}</option>
            </select>
          </div>
          <div class="col-md-3"><input v-model="attendance.date" type="date" class="form-control" required /></div>
          <div class="col-md-3">
            <select v-model="attendance.status" class="form-select">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
          </div>
          <div class="col-md-2"><button class="btn btn-outline-success w-100" type="submit">{{ $t('Attendance') }}</button></div>
        </form>
        <form class="row g-2 mb-3" @submit.prevent="saveLeave">
          <div class="col-md-4">
            <select v-model="leave.employeeId" class="form-select" required>
              <option value="" disabled>Employee</option>
              <option v-for="row in employees" :key="row._id" :value="row._id">{{ row.name }}</option>
            </select>
          </div>
          <div class="col-md-2"><input v-model="leave.from" type="date" class="form-control" required /></div>
          <div class="col-md-2"><input v-model="leave.to" type="date" class="form-control" required /></div>
          <div class="col-md-2"><button class="btn btn-outline-success w-100" type="submit">{{ $t('Request leave') }}</button></div>
        </form>
        <ul class="list-group mb-3">
          <li v-for="row in leaveRows" :key="row._id" class="list-group-item d-flex justify-content-between">
            <span>{{ row.employee?.name || 'Employee' }} {{ row.from }} to {{ row.to }} ({{ row.status }})</span>
            <span v-if="row.status === 'pending'">
              <button type="button" class="btn btn-sm btn-success me-1" @click="decide(row, 'approved')">{{ $t('Approve') }}</button>
              <button type="button" class="btn btn-sm btn-outline-danger" @click="decide(row, 'rejected')">{{ $t('Reject') }}</button>
            </span>
          </li>
        </ul>
        <form class="row g-2" @submit.prevent="runPay">
          <div class="col-md-3"><input v-model="payrollMonth" type="month" class="form-control" required /></div>
          <div class="col-md-3"><button class="btn btn-success" type="submit">{{ $t('Run payroll') }}</button></div>
        </form>
        <p v-if="payroll" class="mt-2 mb-0">Net {{ payroll.netUgx }} UGX, PAYE {{ payroll.payeUgx }}, NSSF {{ payroll.nssfUgx }}</p>
      </div>
    </section>

    <section v-if="active === 'payables'" class="card mb-3">
      <div class="card-body">
        <form class="row g-2 mb-3" @submit.prevent="saveBill">
          <div class="col-md-4">
            <select v-model="bill.supplierId" class="form-select" required>
              <option value="" disabled>Supplier</option>
              <option v-for="row in suppliers" :key="row._id" :value="row._id">{{ row.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="bill.purchaseOrderId" class="form-select" required>
              <option value="" disabled>Received order</option>
              <option v-for="order in supplierOrders" :key="order._id" :value="order._id">
                {{ order.supplier?.name || 'Supplier' }} — {{ order.status }}
              </option>
            </select>
          </div>
          <div class="col-md-3"><input v-model.trim="bill.reference" class="form-control" placeholder="Supplier invoice" /></div>
          <div class="col-md-2"><button class="btn btn-success" type="submit">{{ $t('Record bill') }}</button></div>
          <div class="col-12">
            <p class="text-muted small mb-0">The bill uses the cost of goods already received and does not credit accounts payable again.</p>
          </div>
        </form>
        <div v-for="row in bills" :key="row._id" class="border rounded p-2 mb-2">
          <div>{{ row.supplier?.name || 'Supplier' }} — open {{ row.balanceUgx }} of {{ row.amountUgx }} UGX</div>
          <form v-if="row.balanceUgx > 0" class="row g-2 mt-1" @submit.prevent="pay(row)">
            <div class="col-md-3"><input v-model.number="row.payAmount" type="number" min="1" class="form-control" placeholder="Amount" required /></div>
            <div class="col-md-3"><input v-model="row.paidOn" type="date" class="form-control" required /></div>
            <div class="col-md-2">
              <select v-model="row.method" class="form-select"><option value="bank">Bank</option><option value="cash">Cash</option></select>
            </div>
            <div class="col-md-2"><button class="btn btn-outline-success" type="submit">{{ $t('Record payment') }}</button></div>
          </form>
        </div>
      </div>
    </section>

    <section v-if="active === 'warehouse'" class="card mb-3">
      <div class="card-body">
        <form class="row g-2 mb-3" @submit.prevent="saveBin">
          <div class="col-md-3"><input v-model.trim="bin.code" class="form-control" placeholder="Bin code" required /></div>
          <div class="col-md-3"><input v-model.trim="bin.aisle" class="form-control" placeholder="Aisle" /></div>
          <div class="col-md-2"><button class="btn btn-success" type="submit">{{ $t('Add bin') }}</button></div>
        </form>
        <form class="row g-2 mb-3" @submit.prevent="savePutaway">
          <div class="col-md-3">
            <select v-model="put.binId" class="form-select" required>
              <option value="" disabled>Bin</option>
              <option v-for="row in bins" :key="row._id" :value="row._id">{{ row.code }} {{ row.aisle }}</option>
            </select>
          </div>
          <div class="col-md-2"><input v-model.trim="put.produceName" class="form-control" placeholder="Produce" required /></div>
          <div class="col-md-2"><input v-model.trim="put.produceType" class="form-control" placeholder="Type" required /></div>
          <div class="col-md-2"><input v-model.number="put.qtyKg" type="number" min="0.001" step="0.001" class="form-control" placeholder="Kg" required /></div>
          <div class="col-md-2"><button class="btn btn-outline-success" type="submit">Put away</button></div>
        </form>
        <form class="row g-2 mb-3" @submit.prevent="savePick">
          <div class="col-md-4"><input v-model.trim="saleId" class="form-control" placeholder="Sale id" required /></div>
          <div class="col-md-2"><button class="btn btn-outline-success" type="submit">Pick list</button></div>
        </form>
        <pre v-if="pick" class="small bg-light p-2">{{ pick }}</pre>
        <ul class="list-group">
          <li v-for="row in bins" :key="row._id" class="list-group-item">
            {{ row.code }} {{ row.aisle }}
            <span v-for="stock in row.stock" :key="stock._id" class="ms-2">{{ stock.produceName }} {{ stock.qtyKg }} kg</span>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="active === 'weighbridge'" class="card mb-3">
      <div class="card-body">
        <form class="row g-2" @submit.prevent="saveWeight">
          <div class="col-md-3"><input v-model.trim="scale.scaleId" class="form-control" placeholder="Scale id" required /></div>
          <div class="col-md-2"><input v-model.number="scale.kg" type="number" min="0" step="0.001" class="form-control" placeholder="Kg" required /></div>
          <div class="col-md-2"><input v-model.trim="scale.raw" class="form-control" placeholder="WT,kg,ST" /></div>
          <div class="col-md-2 form-check mt-2"><input id="stable" v-model="scale.stable" type="checkbox" class="form-check-input" /><label class="form-check-label" for="stable">Stable</label></div>
          <div class="col-md-2"><button class="btn btn-success" type="submit">Save reading</button></div>
        </form>
        <p v-if="weight" class="mt-2 mb-0">Latest stable reading: {{ weight.kg }} kg from {{ weight.scaleId }}</p>
      </div>
    </section>

    <section v-if="active === 'assets'" class="card mb-3">
      <div class="card-body">
        <form class="row g-2 mb-3" @submit.prevent="saveAsset">
          <div class="col-md-3"><input v-model.trim="asset.name" class="form-control" placeholder="Asset" required /></div>
          <div class="col-md-2"><input v-model.number="asset.costUgx" type="number" min="1" class="form-control" placeholder="Cost" required /></div>
          <div class="col-md-2"><input v-model.number="asset.lifeMonths" type="number" min="1" class="form-control" placeholder="Months" required /></div>
          <div class="col-md-2"><input v-model="asset.acquiredOn" type="date" class="form-control" required /></div>
          <div class="col-md-2"><button class="btn btn-success" type="submit">Add asset</button></div>
        </form>
        <form class="row g-2 mb-3" @submit.prevent="depreciate">
          <div class="col-md-3"><input v-model="assetMonth" type="month" class="form-control" required /></div>
          <div class="col-md-3"><button class="btn btn-outline-success" type="submit">Post depreciation</button></div>
        </form>
        <ul class="list-group">
          <li v-for="row in assets" :key="row._id" class="list-group-item d-flex justify-content-between">
            <span>{{ row.name }} {{ row.costUgx }} UGX</span>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="dispose(row)">Dispose</button>
          </li>
        </ul>
        <h6 class="mt-3">Fiscal invoices</h6>
        <ul class="list-group">
          <li v-for="row in fiscal" :key="row._id" class="list-group-item">{{ row.invoiceNumber }} — {{ row.status }}</li>
        </ul>
      </div>
    </section>

    <section v-if="active === 'fleet'" class="card mb-3">
      <div class="card-body">
        <form class="row g-2 mb-3" @submit.prevent="saveVehicle">
          <div class="col-md-3"><input v-model.trim="vehicle.plate" class="form-control" placeholder="Plate" required /></div>
          <div class="col-md-3"><input v-model.trim="vehicle.name" class="form-control" placeholder="Name" /></div>
          <div class="col-md-2"><button class="btn btn-success" type="submit">Add vehicle</button></div>
        </form>
        <form class="row g-2 mb-3" @submit.prevent="saveTrip">
          <div class="col-md-3">
            <select v-model="trip.vehicleId" class="form-select" required>
              <option value="" disabled>Vehicle</option>
              <option v-for="row in fleet.vehicles" :key="row._id" :value="row._id">{{ row.plate }}</option>
            </select>
          </div>
          <div class="col-md-2"><input v-model.trim="trip.fromPlace" class="form-control" placeholder="From" required /></div>
          <div class="col-md-2"><input v-model.trim="trip.toPlace" class="form-control" placeholder="To" required /></div>
          <div class="col-md-1"><input v-model.number="trip.km" type="number" min="0" class="form-control" placeholder="Km" required /></div>
          <div class="col-md-2"><input v-model="trip.travelledOn" type="date" class="form-control" required /></div>
          <div class="col-md-2"><button class="btn btn-outline-success" type="submit">Trip</button></div>
        </form>
        <form class="row g-2" @submit.prevent="saveFuel">
          <div class="col-md-3">
            <select v-model="fuel.vehicleId" class="form-select" required>
              <option value="" disabled>Vehicle</option>
              <option v-for="row in fleet.vehicles" :key="row._id" :value="row._id">{{ row.plate }}</option>
            </select>
          </div>
          <div class="col-md-2"><input v-model.number="fuel.litres" type="number" min="0" step="0.01" class="form-control" placeholder="Litres" required /></div>
          <div class="col-md-2"><input v-model.number="fuel.amountUgx" type="number" min="0" class="form-control" placeholder="UGX" required /></div>
          <div class="col-md-2"><input v-model="fuel.filledOn" type="date" class="form-control" required /></div>
          <div class="col-md-2"><button class="btn btn-outline-success" type="submit">Fuel</button></div>
        </form>
      </div>
    </section>

    <section v-if="active === 'budgets'" class="card mb-3">
      <div class="card-body">
        <form class="row g-2 mb-3" @submit.prevent="saveBudget">
          <div class="col-md-2"><input v-model.trim="budget.account" class="form-control" placeholder="Account" required /></div>
          <div class="col-md-2"><input v-model="budget.month" type="month" class="form-control" required /></div>
          <div class="col-md-2"><input v-model.number="budget.amountUgx" type="number" min="0" class="form-control" placeholder="UGX" required /></div>
          <div class="col-md-2"><button class="btn btn-success" type="submit">Save budget</button></div>
        </form>
        <form class="row g-2 mb-3" @submit.prevent="loadVariance">
          <div class="col-md-3"><input v-model="varianceMonth" type="month" class="form-control" required /></div>
          <div class="col-md-2"><button class="btn btn-outline-success" type="submit">Variance</button></div>
        </form>
        <ul class="list-group">
          <li v-for="row in variance" :key="row._id" class="list-group-item">
            {{ row.account }} budget {{ row.amountUgx }} actual {{ row.actualUgx }} variance {{ row.varianceUgx }}
          </li>
        </ul>
      </div>
    </section>

    <section v-if="active === 'portal'" class="card mb-3">
      <div class="card-body">
        <form class="row g-2" @submit.prevent="savePortal">
          <div class="col-md-4">
            <select v-model="portal.buyerId" class="form-select" required>
              <option value="" disabled>Buyer</option>
              <option v-for="row in buyers" :key="row._id" :value="row._id">{{ row.name }} {{ row.contact }}</option>
            </select>
          </div>
          <div class="col-md-3"><input v-model="portal.password" type="password" minlength="10" class="form-control" placeholder="Password" required /></div>
          <div class="col-md-2"><button class="btn btn-success" type="submit">Enable portal</button></div>
        </form>
      </div>
    </section>

    <section v-if="active === 'drill'" class="card mb-3">
      <div class="card-body">
        <button type="button" class="btn btn-success mb-3" @click="runDrill">Rehearse restore</button>
        <ul class="list-group">
          <li v-for="row in drills" :key="row._id" class="list-group-item">
            {{ row.ok ? 'Passed' : 'Failed' }} — {{ row.collections }} collections, {{ row.documents }} documents. {{ row.note }}
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script>
import { operationsAPI, procurementAPI, suppliersAPI, trustedBuyersAPI } from '../services/api';
import { useAuthStore } from '../stores/auth';

const messageOf = (error) => error.response?.data?.message || error.message || 'Request failed';

export default {
  name: 'BackOffice',
  data() {
    return {
      active: '',
      error: '',
      success: '',
      employees: [],
      leaveRows: [],
      payroll: null,
      payrollMonth: '',
      bills: [],
      suppliers: [],
      bins: [],
      pick: '',
      saleId: '',
      weight: null,
      assets: [],
      fiscal: [],
      assetMonth: '',
      fleet: { vehicles: [], trips: [], fuel: [] },
      variance: [],
      varianceMonth: '',
      buyers: [],
      drills: [],
      employee: { name: '', branch: '', jobTitle: '', contact: '', grossSalaryUgx: 0 },
      attendance: { employeeId: '', date: '', status: 'present' },
      leave: { employeeId: '', from: '', to: '' },
      orders: [],
      bill: { supplierId: '', purchaseOrderId: '', reference: '' },
      bin: { code: '', aisle: '' },
      put: { binId: '', produceName: '', produceType: '', qtyKg: 0 },
      scale: { scaleId: '', kg: 0, raw: '', stable: true },
      asset: { name: '', costUgx: 0, lifeMonths: 12, acquiredOn: '' },
      vehicle: { plate: '', name: '' },
      trip: { vehicleId: '', fromPlace: '', toPlace: '', km: 0, travelledOn: '' },
      fuel: { vehicleId: '', litres: 0, amountUgx: 0, filledOn: '' },
      budget: { account: '6300', month: '', amountUgx: 0 },
      portal: { buyerId: '', password: '' }
    };
  },
  computed: {
    role() {
      return useAuthStore().role;
    },
    homeBranch() {
      return useAuthStore().user?.branch || this.employee.branch || '';
    },
    sections() {
      const all = [
        { id: 'payroll', label: 'Payroll', roles: ['director'] },
        { id: 'payables', label: 'Payables', roles: ['director', 'manager'] },
        { id: 'warehouse', label: 'Warehouse', roles: ['director', 'manager', 'storekeeper'] },
        { id: 'weighbridge', label: 'Weighbridge', roles: ['director', 'manager', 'storekeeper'] },
        { id: 'assets', label: 'Assets', roles: ['director'] },
        { id: 'fleet', label: 'Fleet', roles: ['director', 'manager'] },
        { id: 'budgets', label: 'Budgets', roles: ['director'] },
        { id: 'portal', label: 'Buyer portal', roles: ['director', 'manager'] },
        { id: 'drill', label: 'Restore drill', roles: ['director'] }
      ];
      return all.filter((section) => section.roles.includes(this.role));
    },
    supplierOrders() {
      return this.orders.filter((order) => {
        const supplierId = order.supplier?._id || order.supplier;
        const received = (order.lines || []).some((line) => Number(line.receivedKg) > 0);
        return String(supplierId) === String(this.bill.supplierId) && received;
      });
    }
  },
  mounted() {
    this.active = this.sections[0]?.id || '';
    if (this.active) this.openSection(this.active);
  },
  methods: {
    async run(work, done) {
      this.error = '';
      this.success = '';
      try {
        await work();
        this.success = done;
      } catch (error) {
        this.error = messageOf(error);
      }
    },
    async openSection(id) {
      this.active = id;
      this.error = '';
      const items = (payload) => (Array.isArray(payload) ? payload : payload?.items || []);
      try {
        if (id === 'payroll') {
          this.employees = items((await operationsAPI.listEmployees()).data);
          this.leaveRows = items((await operationsAPI.listLeave()).data);
        }
        if (id === 'payables') {
          this.suppliers = items((await suppliersAPI.getAll()).data);
          this.orders = items((await procurementAPI.listOrders()).data);
          const bills = items((await operationsAPI.listBills()).data);
          this.bills = bills.map((row) => ({ ...row, payAmount: row.balanceUgx, paidOn: '', method: 'bank' }));
        }
        if (id === 'warehouse') this.bins = items((await operationsAPI.listBins()).data);
        if (id === 'weighbridge') this.weight = (await operationsAPI.latestWeighing()).data;
        if (id === 'assets') {
          this.assets = items((await operationsAPI.listAssets()).data);
          this.fiscal = items((await operationsAPI.listFiscal()).data);
        }
        if (id === 'fleet') this.fleet = (await operationsAPI.listFleet()).data || { vehicles: [], trips: [], fuel: [] };
        if (id === 'portal') this.buyers = items((await trustedBuyersAPI.getAll()).data);
        if (id === 'drill') this.drills = items((await operationsAPI.listRestoreDrills()).data);
      } catch (error) {
        this.error = messageOf(error);
      }
    },
    saveEmployee() {
      return this.run(async () => {
        await operationsAPI.createEmployee({ ...this.employee, branch: this.employee.branch || this.homeBranch });
        await this.openSection('payroll');
      }, 'Employee saved.');
    },
    saveAttendance() {
      return this.run(() => operationsAPI.markAttendance(this.attendance), 'Attendance saved.');
    },
    saveLeave() {
      return this.run(async () => {
        await operationsAPI.requestLeave(this.leave);
        await this.openSection('payroll');
      }, 'Leave requested.');
    },
    decide(row, status) {
      return this.run(async () => {
        await operationsAPI.decideLeave(row._id, { status });
        await this.openSection('payroll');
      }, 'Leave updated.');
    },
    runPay() {
      return this.run(async () => {
        this.payroll = (await operationsAPI.runPayroll({ month: this.payrollMonth })).data;
      }, 'Payroll posted.');
    },
    saveBill() {
      return this.run(async () => {
        await operationsAPI.createBill({
          supplierId: this.bill.supplierId,
          purchaseOrderId: this.bill.purchaseOrderId,
          reference: this.bill.reference
        });
        await this.openSection('payables');
      }, 'Bill recorded.');
    },
    pay(row) {
      return this.run(async () => {
        await operationsAPI.payBill(row._id, { amountUgx: row.payAmount, paidOn: row.paidOn, method: row.method });
        await this.openSection('payables');
      }, 'Payment recorded.');
    },
    saveBin() {
      return this.run(async () => {
        await operationsAPI.createBin({ ...this.bin, branch: this.homeBranch });
        await this.openSection('warehouse');
      }, 'Bin saved.');
    },
    savePutaway() {
      return this.run(async () => {
        await operationsAPI.putaway(this.put);
        await this.openSection('warehouse');
      }, 'Stock placed in the bin.');
    },
    savePick() {
      return this.run(async () => {
        this.pick = (await operationsAPI.createPickList({ saleId: this.saleId })).data;
      }, 'Pick list created.');
    },
    saveWeight() {
      return this.run(async () => {
        await operationsAPI.recordWeighing(this.scale);
        this.weight = (await operationsAPI.latestWeighing()).data;
      }, 'Reading saved.');
    },
    saveAsset() {
      return this.run(async () => {
        await operationsAPI.createAsset({ ...this.asset, branch: this.homeBranch });
        await this.openSection('assets');
      }, 'Asset saved.');
    },
    depreciate() {
      return this.run(() => operationsAPI.runDepreciation({ month: this.assetMonth }), 'Depreciation posted.');
    },
    dispose(row) {
      const disposedOn = window.prompt('Disposal date (YYYY-MM-DD)');
      if (!disposedOn) return;
      return this.run(async () => {
        await operationsAPI.disposeAsset(row._id, { disposedOn });
        await this.openSection('assets');
      }, 'Asset disposed.');
    },
    saveVehicle() {
      return this.run(async () => {
        await operationsAPI.createVehicle({ ...this.vehicle, branch: this.homeBranch });
        await this.openSection('fleet');
      }, 'Vehicle saved.');
    },
    saveTrip() {
      return this.run(() => operationsAPI.recordTrip(this.trip), 'Trip saved.');
    },
    saveFuel() {
      return this.run(() => operationsAPI.recordFuel(this.fuel), 'Fuel saved.');
    },
    saveBudget() {
      return this.run(() => operationsAPI.setBudget({ ...this.budget, branch: this.homeBranch }), 'Budget saved.');
    },
    loadVariance() {
      return this.run(async () => {
        this.variance = (await operationsAPI.budgetVariance({ month: this.varianceMonth })).data || [];
      }, 'Variance loaded.');
    },
    savePortal() {
      return this.run(() => operationsAPI.grantPortalAccess(this.portal), 'Portal password saved.');
    },
    runDrill() {
      return this.run(async () => {
        await operationsAPI.recordRestoreDrill();
        await this.openSection('drill');
      }, 'Restore rehearsal recorded.');
    }
  }
};
</script>
