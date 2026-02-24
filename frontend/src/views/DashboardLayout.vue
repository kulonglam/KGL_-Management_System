<template>
  <div>
    <!-- Header -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom app-header">
      <div class="container-fluid px-4">
        <div class="d-flex align-items-center">
          <button
            type="button"
            class="btn btn-outline-secondary d-md-none me-3 sidebar-toggle-btn"
            @click="toggleMobileSidebar"
          >
            <i class="bi bi-list"></i>
          </button>
          <div class="bg-success rounded-circle d-inline-flex align-items-center justify-content-center me-3" 
               style="width: 40px; height: 40px;">
            <i class="bi bi-box-seam text-white"></i>
          </div>
          <div>
            <span class="navbar-brand mb-0 h5">Karibu Groceries LTD</span>
          </div>
        </div>
        <div></div>
      </div>
    </nav>

    <div class="container-fluid">
      <div class="layout">
        <!-- Sidebar -->
        <nav class="sidebar" :class="{ 'is-open': mobileSidebarOpen }">
          <div class="sidebar-inner">
            <div class="sidebar-brand">
              <div class="sidebar-brand-icon">
                <img
                  v-if="user.profileImage"
                  :src="user.profileImage"
                  alt="User profile image"
                  class="sidebar-avatar"
                />
                <i v-else class="bi bi-person-badge"></i>
              </div>
              <div class="sidebar-brand-text">
                <div class="sidebar-brand-name">{{ user.name || 'User Session' }}</div>
                <div class="sidebar-brand-meta">
                  {{ roleLabel }}{{ user.branch ? ` - ${user.branch}` : '' }}
                </div>
              </div>
            </div>

            <div class="sidebar-title">Navigation</div>

            <template v-if="user.role === 'manager'">
              <div
                v-for="section in managerNavSections"
                :key="section.key"
                class="sidebar-group"
              >
                <button
                  type="button"
                  class="sidebar-group-toggle btn btn-link text-start w-100"
                  @click="toggleManagerSection(section.key)"
                >
                  <span>{{ section.label }}</span>
                  <i
                    class="bi"
                    :class="isManagerSectionOpen(section.key) ? 'bi-chevron-up' : 'bi-chevron-down'"
                  ></i>
                </button>

                <ul v-if="isManagerSectionOpen(section.key)" class="nav flex-column sidebar-nav">
                  <li class="nav-item" v-for="item in section.items" :key="item.path">
                    <router-link
                      :to="item.path"
                      class="nav-link sidebar-link"
                      active-class="active"
                      @click="closeMobileSidebar"
                    >
                      <i :class="item.icon"></i>
                      {{ item.label }}
                    </router-link>
                  </li>
                </ul>
              </div>
            </template>

            <ul v-else class="nav flex-column sidebar-nav">
              <li class="nav-item" v-for="item in mainNavItems" :key="item.path">
                <router-link
                  :to="item.path"
                  class="nav-link sidebar-link"
                  active-class="active"
                  @click="closeMobileSidebar"
                >
                  <i :class="item.icon"></i>
                  {{ item.label }}
                </router-link>
              </li>
            </ul>

            <div class="sidebar-footer">
              <ul class="nav flex-column sidebar-nav">
                <li class="nav-item">
                  <button
                    type="button"
                    class="nav-link sidebar-link sidebar-link-danger btn btn-link text-start w-100"
                    @click="openLogoutModal"
                  >
                    <i class="bi bi-box-arrow-right"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div v-if="mobileSidebarOpen" class="sidebar-backdrop d-md-none" @click="closeMobileSidebar"></div>

        <!-- Main Content -->
        <main class="main-content px-md-4 py-4">
          <div class="main-content-body">
            <div
              v-if="user.role === 'manager' && stockNotifications.length > 0"
              class="alert alert-warning d-flex align-items-start justify-content-between gap-3"
            >
              <div class="w-100">
                <strong>Stock Notifications:</strong>
                <div class="mt-2">
                  <div
                    v-for="notification in stockNotifications"
                    :key="notification._id"
                    class="d-flex flex-wrap align-items-center justify-content-between border-top pt-2 mt-2"
                  >
                    <span>{{ notification.message }}</span>
                    <div class="d-flex align-items-center gap-2">
                      <small class="text-muted">{{ formatNotificationTime(notification.createdAt) }}</small>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="markNotificationRead(notification._id)"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" class="btn btn-sm btn-outline-dark" @click="markAllNotificationsRead">
                Acknowledge All
              </button>
            </div>

            <div
              v-if="user.role === 'manager' && outOfStockCount > 0 && !stockAlertDismissed"
              class="alert alert-danger d-flex align-items-center justify-content-between mt-3"
            >
              <div>
                <strong>Out of Stock:</strong> {{ outOfStockCount }} item(s) need restocking.
              </div>
              <div class="d-flex align-items-center gap-2">
                <router-link class="btn btn-light btn-sm" to="/dashboard/inventory">
                  View Inventory
                </router-link>
                <button type="button" class="btn-close" @click="dismissStockAlert"></button>
              </div>
            </div>

            <router-view />
          </div>
          <footer class="dashboard-footer">
            <div class="dashboard-footer-inner">
              <span class="footer-brand">Karibu Groceries LTD</span>
              <span class="footer-divider">|</span>
              <span>Wholesale Produce Management System</span>
              <span class="footer-divider">|</span>
              <span>&copy; {{ currentYear }}</span>
            </div>
          </footer>
        </main>
      </div>
    </div>

    <div v-if="showLogoutModal" class="modal-mask" @click.self="closeLogoutModal">
      <div class="modal-card">
        <div class="modal-header">
          <h5 class="mb-0">Confirm Logout</h5>
          <button type="button" class="btn-close" @click="closeLogoutModal"></button>
        </div>
        <div class="modal-body">
          <p class="mb-4">Are you sure you want to logout?</p>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary" @click="closeLogoutModal">
              Cancel
            </button>
            <button type="button" class="btn btn-danger" @click="confirmLogout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inventoryAPI, notificationsAPI } from '../services/api'

export default {
  name: 'DashboardLayout',
  data() {
    return {
      user: {},
      outOfStockCount: 0,
      stockAlertDismissed: false,
      stockNotifications: [],
      stockMonitorIntervalId: null,
      mobileSidebarOpen: false,
      showLogoutModal: false,
      managerSectionOpen: {
        operations: true,
        records: false,
        administration: false
      }
    }
  },
  computed: {
    currentYear() {
      return new Date().getFullYear()
    },
    roleLabel() {
      const roles = {
        director: 'Director',
        manager: 'Manager',
        sales_agent: 'Sales Agent'
      }
      return roles[this.user.role] || ''
    },
    navItems() {
      const items = []

      if (this.user.role === 'director') {
        items.push(
          { path: '/dashboard/director', icon: 'bi bi-graph-up', label: 'Dashboard' },
          { path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' }
        )
      } else if (this.user.role === 'manager') {
        items.push(
          { path: '/dashboard/manager', icon: 'bi bi-graph-up', label: 'Dashboard' },
          { path: '/dashboard/inventory', icon: 'bi bi-box', label: 'Inventory' },
          { path: '/dashboard/procurement', icon: 'bi bi-file-text', label: 'Procurement' },
          { path: '/dashboard/sales', icon: 'bi bi-cart', label: 'Sales' },
          { path: '/dashboard/credit-sales', icon: 'bi bi-credit-card', label: 'Credit Sales' },
          { path: '/dashboard/credit-sales-records', icon: 'bi bi-journal-text', label: 'Credit Sales Records' },
          { path: '/dashboard/price-management', icon: 'bi bi-tags', label: 'Price Management' },
          { path: '/dashboard/procurement-records', icon: 'bi bi-card-list', label: 'Procurement Records' },
          { path: '/dashboard/trusted-buyers', icon: 'bi bi-person-check', label: 'Trusted Buyers' },
          { path: '/dashboard/users', icon: 'bi bi-people', label: 'Users' },
          { path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' }
        )
      } else if (this.user.role === 'sales_agent') {
        items.push(
          { path: '/dashboard/sales-agent', icon: 'bi bi-graph-up', label: 'Dashboard' },
          { path: '/dashboard/inventory', icon: 'bi bi-box', label: 'Inventory' },
          { path: '/dashboard/sales', icon: 'bi bi-cart', label: 'Sales' },
          { path: '/dashboard/credit-sales', icon: 'bi bi-credit-card', label: 'Credit Sales' },
          { path: '/dashboard/credit-sales-records', icon: 'bi bi-journal-text', label: 'Credit Sales Records' },
          { path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' }
        )
      }

      return items
    },
    mainNavItems() {
      return this.navItems.filter(item => item.path)
    },
    managerNavSections() {
      const itemMap = new Map(this.mainNavItems.map(item => [item.path, item]))
      const pick = (paths) => paths.map(path => itemMap.get(path)).filter(Boolean)

      return [
        {
          key: 'operations',
          label: 'Operations',
          items: pick([
            '/dashboard/manager',
            '/dashboard/inventory',
            '/dashboard/procurement',
            '/dashboard/sales',
            '/dashboard/credit-sales'
          ])
        },
        {
          key: 'records',
          label: 'Records',
          items: pick([
            '/dashboard/credit-sales-records',
            '/dashboard/procurement-records'
          ])
        },
        {
          key: 'administration',
          label: 'Administration',
          items: pick([
            '/dashboard/price-management',
            '/dashboard/trusted-buyers',
            '/dashboard/users',
            '/dashboard/profile'
          ])
        }
      ].filter(section => section.items.length > 0)
    }
  },
  watch: {
    '$route.path'() {
      this.ensureActiveManagerSectionOpen()
    }
  },
  created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}')
    if (this.user.role === 'manager') {
      this.loadStockAlert()
      this.loadStockNotifications()
      this.ensureActiveManagerSectionOpen()
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleViewportResize)
    window.addEventListener('user-updated', this.syncUserFromStorage)
    if (this.user.role === 'manager') {
      this.startStockMonitor()
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleViewportResize)
    window.removeEventListener('user-updated', this.syncUserFromStorage)
    this.stopStockMonitor()
  },
  methods: {
    syncUserFromStorage() {
      const previousRole = this.user.role
      this.user = JSON.parse(localStorage.getItem('user') || '{}')
      if (this.user.role === 'manager' && previousRole !== 'manager') {
        this.loadStockAlert()
        this.loadStockNotifications()
        this.startStockMonitor()
      }
      if (this.user.role !== 'manager' && previousRole === 'manager') {
        this.stopStockMonitor()
        this.stockNotifications = []
      }
    },
    openLogoutModal() {
      this.showLogoutModal = true
    },
    closeLogoutModal() {
      this.showLogoutModal = false
    },
    confirmLogout() {
      this.closeMobileSidebar()
      this.closeLogoutModal()
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/')
    },
    toggleMobileSidebar() {
      this.mobileSidebarOpen = !this.mobileSidebarOpen
    },
    closeMobileSidebar() {
      this.mobileSidebarOpen = false
    },
    handleViewportResize() {
      if (window.innerWidth >= 768 && this.mobileSidebarOpen) {
        this.mobileSidebarOpen = false
      }
    },
    isManagerSectionOpen(sectionKey) {
      return this.managerSectionOpen[sectionKey] === true
    },
    toggleManagerSection(sectionKey) {
      this.managerSectionOpen[sectionKey] = !this.isManagerSectionOpen(sectionKey)
    },
    ensureActiveManagerSectionOpen() {
      if (this.user.role !== 'manager') return
      const activeSection = this.managerNavSections.find(section =>
        section.items.some(item => this.$route.path === item.path)
      )
      if (activeSection) {
        this.managerSectionOpen[activeSection.key] = true
      }
    },
    async loadStockAlert() {
      try {
        const response = await inventoryAPI.get()
        const outOfStockItems = response.data.outOfStockItems || []
        this.outOfStockCount = outOfStockItems.length
      } catch (error) {
        console.error('Failed to load stock alert:', error)
      }
    },
    dismissStockAlert() {
      this.stockAlertDismissed = true
    },
    startStockMonitor() {
      this.stopStockMonitor()
      this.stockMonitorIntervalId = window.setInterval(() => {
        this.loadStockAlert()
        this.loadStockNotifications()
      }, 60000)
    },
    stopStockMonitor() {
      if (this.stockMonitorIntervalId) {
        window.clearInterval(this.stockMonitorIntervalId)
        this.stockMonitorIntervalId = null
      }
    },
    async loadStockNotifications() {
      try {
        const response = await notificationsAPI.getAll({ unread: true })
        this.stockNotifications = response.data || []
      } catch (error) {
        console.error('Failed to load stock notifications:', error)
      }
    },
    async markNotificationRead(notificationId) {
      try {
        await notificationsAPI.markAsRead(notificationId)
        this.stockNotifications = this.stockNotifications.filter(
          (notification) => notification._id !== notificationId
        )
      } catch (error) {
        console.error('Failed to acknowledge notification:', error)
      }
    },
    async markAllNotificationsRead() {
      const notificationIds = this.stockNotifications.map((notification) => notification._id)
      for (let i = 0; i < notificationIds.length; i += 1) {
        await this.markNotificationRead(notificationIds[i])
      }
    },
    formatNotificationTime(value) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      return date.toLocaleString('en-UG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.sidebar-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
</style>
