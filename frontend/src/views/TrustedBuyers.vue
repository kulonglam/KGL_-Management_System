<template>
  <div>
    <h2 class="mb-4">Trusted Buyers</h2>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Trusted Buyers List</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm" @click="toggleForm">
            {{ showForm ? (editingId ? 'Close Edit' : 'Hide Form') : 'Add Buyer' }}
          </button>
          <button class="btn btn-outline-primary btn-sm" @click="loadBuyers" :disabled="loadingList">
            <span v-if="loadingList" class="spinner-border spinner-border-sm me-2"></span>
            Refresh
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="buyers.length === 0" class="text-center py-5 text-muted">
          No trusted buyers found for this branch.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>National ID</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Branch</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in buyers" :key="item._id">
                <td>{{ item.name }}</td>
                <td>{{ item.nationalId }}</td>
                <td>{{ item.location }}</td>
                <td>{{ item.contact }}</td>
                <td>{{ item.branch }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" @click="startEdit(item)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteBuyer(item)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="card mt-4">
      <div class="card-header">
        <h5 class="mb-0">{{ editingId ? 'Update Buyer' : 'Add Trusted Buyer' }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Buyer Name *</label>
              <input
                type="text"
                class="form-control"
                v-model="form.name"
                minlength="2"
                pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
                title="Use letters/numbers. Spaces between words are allowed."
                required
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">National ID (NIN) *</label>
              <input
                type="text"
                class="form-control"
                v-model="form.nationalId"
                pattern="[A-Z0-9]{14}"
                maxlength="14"
                placeholder="14 alphanumeric characters"
                required
                :disabled="editingId"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">Location *</label>
              <input
                type="text"
                class="form-control"
                v-model="form.location"
                minlength="2"
                pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
                title="Use letters/numbers. Spaces between words are allowed."
                required
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">Contact *</label>
              <input
                type="text"
                class="form-control"
                v-model="form.contact"
                pattern="^(\\+256|0)[0-9]{9}$"
                placeholder="+256700000000"
                required
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">Branch</label>
              <input type="text" class="form-control" :value="user.branch" disabled />
            </div>
          </div>

          <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
          <div v-if="success" class="alert alert-success mt-3">{{ success }}</div>

          <div class="mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingId ? 'Update Buyer' : 'Add Buyer' }}
            </button>
            <button
              v-if="editingId"
              type="button"
              class="btn btn-outline-secondary ms-2"
              @click="cancelEdit"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { trustedBuyersAPI } from '../services/api'

export default {
  name: 'TrustedBuyers',
  data() {
    return {
      user: {},
      buyers: [],
      loadingList: false,
      showForm: false,
      editingId: null,
      form: {
        name: '',
        nationalId: '',
        location: '',
        contact: ''
      },
      loading: false,
      error: '',
      success: ''
    }
  },
  async created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}')
    await this.loadBuyers()
  },
  methods: {
    async loadBuyers() {
      this.loadingList = true
      try {
        const response = await trustedBuyersAPI.getAll()
        this.buyers = response.data
      } catch (error) {
        console.error('Failed to load trusted buyers:', error)
      } finally {
        this.loadingList = false
      }
    },
    async handleSubmit() {
      this.loading = true
      this.error = ''
      this.success = ''

      try {
        const payload = {
          name: this.normalizeText(this.form.name),
          nationalId: this.form.nationalId.toUpperCase(),
          location: this.normalizeText(this.form.location),
          contact: this.form.contact.trim()
        }

        if (this.editingId) {
          await trustedBuyersAPI.update(this.editingId, payload)
          this.success = 'Trusted buyer updated successfully!'
        } else {
          await trustedBuyersAPI.create(payload)
          this.success = 'Trusted buyer added successfully!'
        }

        this.resetForm()
        await this.loadBuyers()
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          (this.editingId ? 'Failed to update trusted buyer' : 'Failed to add trusted buyer')
      } finally {
        this.loading = false
      }
    },
    startEdit(item) {
      this.editingId = item._id
      this.showForm = true
      this.form = {
        name: item.name,
        nationalId: item.nationalId,
        location: item.location,
        contact: item.contact
      }
      this.error = ''
      this.success = ''
    },
    cancelEdit() {
      this.resetForm()
    },
    async deleteBuyer(item) {
      if (!confirm(`Delete trusted buyer ${item.name}?`)) return
      try {
        await trustedBuyersAPI.delete(item._id)
        if (this.editingId === item._id) {
          this.resetForm()
        }
        await this.loadBuyers()
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete trusted buyer'
      }
    },
    resetForm() {
      this.editingId = null
      this.showForm = false
      this.form = {
        name: '',
        nationalId: '',
        location: '',
        contact: ''
      }
    },
    toggleForm() {
      if (this.showForm && this.editingId) {
        this.resetForm()
      } else {
        this.showForm = !this.showForm
      }
      this.error = ''
      this.success = ''
    },
    normalizeText(value) {
      return String(value || '').trim().replace(/\s+/g, ' ')
    }
  }
}
</script>
