<template>
  <div class="container py-5" style="max-width: 760px">
    <h1 class="h3">{{ $t('Buyer statement portal') }}</h1>
    <p class="text-muted">Sign in with the phone number and password your branch gave you.</p>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <form v-if="!home" class="card" @submit.prevent="login">
      <div class="card-body">
        <label class="form-label" for="portal-phone">Phone</label>
        <input id="portal-phone" v-model.trim="contact" class="form-control mb-3" required />
        <label class="form-label" for="portal-password">Password</label>
        <input id="portal-password" v-model="password" type="password" minlength="10" class="form-control mb-3" required />
        <button class="btn btn-success" type="submit">Sign in</button>
      </div>
    </form>

    <div v-else>
      <p>Hello {{ home.buyer.name }}. Open balance and movements are below.</p>
      <p class="fw-bold">Closing balance {{ home.statement?.closingBalanceUgx ?? 0 }} UGX</p>
      <table class="table table-sm">
        <thead>
          <tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th></tr>
        </thead>
        <tbody>
          <tr v-for="(line, index) in home.statement?.lines || []" :key="index">
            <td>{{ line.date }}</td>
            <td>{{ line.description }}</td>
            <td>{{ line.debitUgx }}</td>
            <td>{{ line.creditUgx }}</td>
          </tr>
        </tbody>
      </table>
      <h2 class="h5">Invoices</h2>
      <ul class="list-group">
        <li v-for="invoice in home.invoices" :key="invoice._id" class="list-group-item">
          {{ invoice.invoiceNumber }} — {{ invoice.grossUgx }} UGX
        </li>
      </ul>
      <button type="button" class="btn btn-link px-0" @click="logout">Sign out</button>
    </div>
  </div>
</template>

<script>
import { portalAPI } from '../services/api';

export default {
  name: 'Portal',
  data() {
    return { contact: '', password: '', error: '', home: null };
  },
  mounted() {
    if (window.sessionStorage.getItem('kgl.portalToken')) this.load();
  },
  methods: {
    async login() {
      this.error = '';
      try {
        const result = (await portalAPI.login({ contact: this.contact, password: this.password })).data;
        window.sessionStorage.setItem('kgl.portalToken', result.token);
        await this.load();
      } catch (error) {
        this.error = error.response?.data?.message || 'Sign in failed';
      }
    },
    async load() {
      try {
        this.home = (await portalAPI.home()).data;
      } catch (error) {
        window.sessionStorage.removeItem('kgl.portalToken');
        this.home = null;
        this.error = error.response?.data?.message || 'Sign in failed';
      }
    },
    logout() {
      window.sessionStorage.removeItem('kgl.portalToken');
      this.home = null;
    }
  }
};
</script>
