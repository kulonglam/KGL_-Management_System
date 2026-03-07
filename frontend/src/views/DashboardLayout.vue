<template>
  <div>
    <a href="#main-content-region" class="skip-link">Skip to main content</a>
    <!-- Header -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom app-header">
      <div class="container-fluid px-4">
        <div class="d-flex align-items-center">
          <button
            ref="sidebarToggleButtonRef"
            type="button"
            class="btn btn-outline-secondary d-md-none me-3 sidebar-toggle-btn"
            :aria-expanded="mobileSidebarOpen ? 'true' : 'false'"
            aria-controls="app-sidebar-nav"
            aria-label="Toggle navigation menu"
            @click="toggleMobileSidebar"
          >
            <i class="bi bi-list"></i>
          </button>
          <div class="app-brand-logo-wrap me-3">
            <img :src="brandLogo" alt="Karibu Groceries LTD logo" class="app-brand-logo" />
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
        <nav
          ref="sidebarRef"
          id="app-sidebar-nav"
          class="sidebar"
          :class="{ 'is-open': mobileSidebarOpen }"
          aria-label="Main navigation"
        >
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
              <div v-for="section in managerNavSections" :key="section.key" class="sidebar-group">
                <button
                  type="button"
                  class="sidebar-group-toggle btn btn-link text-start w-100"
                  :aria-expanded="isManagerSectionOpen(section.key) ? 'true' : 'false'"
                  :aria-controls="`manager-nav-section-${section.key}`"
                  @click="toggleManagerSection(section.key)"
                >
                  <span>{{ section.label }}</span>
                  <i
                    class="bi"
                    :class="isManagerSectionOpen(section.key) ? 'bi-chevron-up' : 'bi-chevron-down'"
                  ></i>
                </button>

                <ul
                  v-if="isManagerSectionOpen(section.key)"
                  :id="`manager-nav-section-${section.key}`"
                  class="nav flex-column sidebar-nav"
                >
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

        <div
          v-if="mobileSidebarOpen"
          class="sidebar-backdrop d-md-none"
          @click="closeMobileSidebar"
        ></div>

        <!-- Main Content -->
        <main id="main-content-region" class="main-content px-md-4 py-4" tabindex="-1">
          <div class="main-content-body">
            <div v-if="user.role === 'manager'" class="notice-stack mb-3">
              <div v-if="stockNotifications.length > 0" class="card notice-card">
                <div class="card-body">
                  <div class="notice-header">
                    <div>
                      <h5 class="notice-title">Stock Notifications</h5>
                      <p class="notice-copy">Recent branch alerts that need acknowledgement.</p>
                    </div>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      @click="markAllNotificationsRead"
                    >
                      Acknowledge All
                    </button>
                  </div>
                  <div class="notice-list">
                    <div
                      v-for="notification in stockNotifications"
                      :key="notification._id"
                      class="notice-item d-flex flex-wrap align-items-start justify-content-between gap-3"
                    >
                      <div class="flex-grow-1">
                        <div>{{ notification.message }}</div>
                        <small class="notice-item-meta">{{
                          formatNotificationTime(notification.createdAt)
                        }}</small>
                      </div>
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
              <div
                v-if="outOfStockCount > 0 && !stockAlertDismissed"
                class="card notice-card notice-card--danger"
              >
                <div class="card-body">
                  <div class="notice-header mb-0">
                    <div>
                      <h5 class="notice-title">Out of Stock</h5>
                      <p class="notice-copy">{{ outOfStockCount }} item(s) need restocking.</p>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <router-link class="btn btn-sm btn-outline-danger" to="/dashboard/inventory">
                        View Inventory
                      </router-link>
                      <button
                        type="button"
                        class="btn-close"
                        aria-label="Dismiss out-of-stock alert"
                        @click="dismissStockAlert"
                      ></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <router-view />
          </div>
          <footer class="dashboard-footer">
            <div class="dashboard-footer-inner">
              <span>&copy; {{ currentYear }}</span>
              <span class="footer-divider">|</span>
              <span class="footer-brand">Karibu Groceries LTD</span>
              <span class="footer-divider">|</span>
              <span>Wholesale Produce Management System</span>
            </div>
          </footer>
        </main>
      </div>
    </div>

    <div v-if="showLogoutModal" class="modal-mask" @click.self="closeLogoutModal">
      <div
        ref="logoutModalRef"
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        tabindex="-1"
      >
        <div class="modal-header">
          <h5 id="logout-modal-title" class="mb-0">Confirm Logout</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close logout confirmation"
            @click="closeLogoutModal"
          ></button>
        </div>
        <div class="modal-body">
          <p class="mb-4">Are you sure you want to logout?</p>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary" @click="closeLogoutModal">
              Cancel
            </button>
            <button type="button" class="btn btn-danger" @click="confirmLogout">Logout</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * Shared authenticated layout: sidebar/navigation, stock alerts, and logout modal controls.
 * File: frontend/src/views/DashboardLayout.vue
 */

import { inventoryAPI, notificationsAPI } from '../services/api';
import brandLogo from '../assets/images/logo.png';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { formatDisplayTimestamp } from '../utils/dateFormat.mjs';
import { isDirectorOrban } from '../utils/directorAccess.mjs';

export default {
  name: 'DashboardLayout',
  data() {
    return {
      brandLogo,
      authStore: useAuthStore(pinia),
      outOfStockCount: 0,
      stockAlertDismissed: false,
      stockNotifications: [],
      stockMonitorIntervalId: null,
      mobileSidebarOpen: false,
      showLogoutModal: false,
      lastFocusedElement: null,
      lastSidebarFocusedElement: null,
      managerSectionOpen: {
        operations: true,
        records: false,
        administration: false
      }
    };
  },
  computed: {
    user() {
      return this.authStore.user || {};
    },
    // Footer year rendered dynamically.
    currentYear() {
      return new Date().getFullYear();
    },
    roleLabel() {
      // Friendly labels for role codes stored in auth payload.
      const roles = {
        director: 'Director',
        manager: 'Manager',
        sales_agent: 'Sales Agent'
      };
      return roles[this.user.role] || '';
    },
    navItems() {
      const items = [];

      if (isDirectorOrban(this.user)) {
        items.push(
          { path: '/dashboard/director', icon: 'bi bi-grid', label: 'Dashboard' },
          { path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' }
        );
      } else if (this.user.role === 'director') {
        items.push({ path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' });
      } else if (this.user.role === 'manager') {
        items.push(
          { path: '/dashboard/manager', icon: 'bi bi-grid', label: 'Dashboard' },
          { path: '/dashboard/inventory', icon: 'bi bi-box', label: 'Inventory' },
          { path: '/dashboard/procurement', icon: 'bi bi-file-text', label: 'Procurement' },
          { path: '/dashboard/sales', icon: 'bi bi-cart', label: 'Sales' },
          { path: '/dashboard/credit-sales', icon: 'bi bi-credit-card', label: 'Credit Sales' },
          {
            path: '/dashboard/sales-records',
            icon: 'bi bi-receipt',
            label: 'Sales Records'
          },
          {
            path: '/dashboard/credit-sales-records',
            icon: 'bi bi-journal-text',
            label: 'Credit Sales Records'
          },
          { path: '/dashboard/price-management', icon: 'bi bi-tags', label: 'Price Management' },
          {
            path: '/dashboard/procurement-records',
            icon: 'bi bi-card-list',
            label: 'Procurement Records'
          },
          {
            path: '/dashboard/trusted-buyers',
            icon: 'bi bi-person-check',
            label: 'Trusted Buyers'
          },
          { path: '/dashboard/users', icon: 'bi bi-people', label: 'Users' },
          { path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' }
        );
      } else if (this.user.role === 'sales_agent') {
        items.push(
          { path: '/dashboard/sales-agent', icon: 'bi bi-graph-up', label: 'Dashboard' },
          { path: '/dashboard/inventory', icon: 'bi bi-box', label: 'Inventory' },
          { path: '/dashboard/sales', icon: 'bi bi-cart', label: 'Sales' },
          { path: '/dashboard/credit-sales', icon: 'bi bi-credit-card', label: 'Credit Sales' },
          {
            path: '/dashboard/sales-records',
            icon: 'bi bi-receipt',
            label: 'Sales Records'
          },
          {
            path: '/dashboard/credit-sales-records',
            icon: 'bi bi-journal-text',
            label: 'Credit Sales Records'
          },
          { path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' }
        );
      }

      return items;
    },
    mainNavItems() {
      return this.navItems.filter((item) => item.path);
    },
    managerNavSections() {
      const itemMap = new Map(this.mainNavItems.map((item) => [item.path, item]));
      // Build sections from already-authorized nav items so hidden routes are excluded automatically.
      const pick = (paths) => paths.map((path) => itemMap.get(path)).filter(Boolean);

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
            '/dashboard/sales-records',
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
      ].filter((section) => section.items.length > 0);
    }
  },
  watch: {
    '$route.path'() {
      this.ensureActiveManagerSectionOpen();
    },
    mobileSidebarOpen(isOpen) {
      if (window.innerWidth >= 768) {
        document.body.classList.remove('no-scroll');
        return;
      }

      if (isOpen) {
        document.body.classList.add('no-scroll');
        this.focusSidebar();
        return;
      }

      document.body.classList.remove('no-scroll');
      this.restoreSidebarFocus();
    },
    showLogoutModal(isOpen) {
      if (isOpen) {
        this.focusLogoutModal();
        return;
      }
      this.restoreLastFocus();
    }
  },
  created() {
    if (this.user.role === 'manager') {
      this.loadStockAlert();
      this.loadStockNotifications();
      this.ensureActiveManagerSectionOpen();
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleViewportResize);
    window.addEventListener('keydown', this.handleEscapeKey);
    if (this.user.role === 'manager') {
      this.startStockMonitor();
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleViewportResize);
    window.removeEventListener('keydown', this.handleEscapeKey);
    document.body.classList.remove('no-scroll');
    this.stopStockMonitor();
  },
  methods: {
    openLogoutModal() {
      this.lastFocusedElement = document.activeElement;
      this.showLogoutModal = true;
    },
    focusLogoutModal() {
      this.$nextTick(() => {
        const firstFocusable = this.getLogoutModalFocusableElements()[0];
        if (firstFocusable) {
          firstFocusable.focus();
          return;
        }
        this.$refs.logoutModalRef?.focus();
      });
    },
    closeLogoutModal() {
      this.showLogoutModal = false;
    },
    confirmLogout() {
      this.closeMobileSidebar();
      this.closeLogoutModal();
      this.authStore.clearSession();
      this.$router.push('/');
    },
    toggleMobileSidebar() {
      if (!this.mobileSidebarOpen) {
        this.lastSidebarFocusedElement = document.activeElement;
      }
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
    },
    closeMobileSidebar() {
      if (!this.mobileSidebarOpen) return;
      this.mobileSidebarOpen = false;
    },
    getLogoutModalFocusableElements() {
      return Array.from(
        this.$refs.logoutModalRef?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      );
    },
    trapLogoutModalFocus(event) {
      if (!this.showLogoutModal || event.key !== 'Tab') return;

      const focusable = this.getLogoutModalFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        this.$refs.logoutModalRef?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Keep keyboard focus inside the modal while it is open.
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    getSidebarFocusableElements() {
      return Array.from(
        this.$refs.sidebarRef?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      );
    },
    focusSidebar() {
      this.$nextTick(() => {
        const firstFocusable = this.getSidebarFocusableElements()[0];
        firstFocusable?.focus();
      });
    },
    trapSidebarFocus(event) {
      if (!this.mobileSidebarOpen || event.key !== 'Tab' || window.innerWidth >= 768) return;

      const focusable = this.getSidebarFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Keep focus cycling inside the mobile drawer until it is closed.
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    restoreLastFocus() {
      const element = this.lastFocusedElement;
      if (element && typeof element.focus === 'function') {
        element.focus();
      }
      this.lastFocusedElement = null;
    },
    restoreSidebarFocus() {
      const element = this.lastSidebarFocusedElement;
      if (element && typeof element.focus === 'function') {
        element.focus();
        this.lastSidebarFocusedElement = null;
        return;
      }
      this.$refs.sidebarToggleButtonRef?.focus();
      this.lastSidebarFocusedElement = null;
    },
    handleEscapeKey(event) {
      if (this.showLogoutModal && event.key === 'Tab') {
        this.trapLogoutModalFocus(event);
        return;
      }
      if (this.mobileSidebarOpen && event.key === 'Tab') {
        this.trapSidebarFocus(event);
        return;
      }
      if (event.key !== 'Escape') return;
      if (this.showLogoutModal) {
        this.closeLogoutModal();
        return;
      }
      if (this.mobileSidebarOpen) {
        this.closeMobileSidebar();
      }
    },
    handleViewportResize() {
      if (window.innerWidth >= 768 && this.mobileSidebarOpen) {
        this.mobileSidebarOpen = false;
      }
      if (window.innerWidth >= 768) {
        document.body.classList.remove('no-scroll');
      } else if (this.mobileSidebarOpen) {
        document.body.classList.add('no-scroll');
      }
    },
    isManagerSectionOpen(sectionKey) {
      return this.managerSectionOpen[sectionKey] === true;
    },
    toggleManagerSection(sectionKey) {
      this.managerSectionOpen[sectionKey] = !this.isManagerSectionOpen(sectionKey);
    },
    ensureActiveManagerSectionOpen() {
      if (this.user.role !== 'manager') return;
      const activeSection = this.managerNavSections.find((section) =>
        section.items.some((item) => this.$route.path === item.path)
      );
      if (activeSection) {
        this.managerSectionOpen[activeSection.key] = true;
      }
    },
    async loadStockAlert() {
      try {
        const response = await inventoryAPI.get();
        const outOfStockItems = response.data.outOfStockItems || [];
        this.outOfStockCount = outOfStockItems.length;
      } catch (error) {
        console.error('Failed to load stock alert:', error);
      }
    },
    dismissStockAlert() {
      this.stockAlertDismissed = true;
    },
    startStockMonitor() {
      this.stopStockMonitor();
      // Poll every minute so stock alerts stay fresh without manual refresh.
      this.stockMonitorIntervalId = window.setInterval(() => {
        this.loadStockAlert();
        this.loadStockNotifications();
      }, 60000);
    },
    stopStockMonitor() {
      if (this.stockMonitorIntervalId) {
        window.clearInterval(this.stockMonitorIntervalId);
        this.stockMonitorIntervalId = null;
      }
    },
    async loadStockNotifications() {
      try {
        const response = await notificationsAPI.getAll({ unread: true });
        this.stockNotifications = response.data || [];
      } catch (error) {
        console.error('Failed to load stock notifications:', error);
      }
    },
    async markNotificationRead(notificationId) {
      try {
        await notificationsAPI.markAsRead(notificationId);
        this.stockNotifications = this.stockNotifications.filter(
          (notification) => notification._id !== notificationId
        );
      } catch (error) {
        console.error('Failed to acknowledge notification:', error);
      }
    },
    async markAllNotificationsRead() {
      const notificationIds = this.stockNotifications.map((notification) => notification._id);
      for (let i = 0; i < notificationIds.length; i += 1) {
        await this.markNotificationRead(notificationIds[i]);
      }
    },
    formatNotificationTime(value) {
      return value ? formatDisplayTimestamp(value) : '';
    }
  }
};
</script>

<style scoped>
/* Component styles */
.sidebar-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.app-brand-logo-wrap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d1d5db;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.app-brand-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

