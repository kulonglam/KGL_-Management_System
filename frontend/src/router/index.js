/**
 * Declares application routes and enforces authentication/role-based access rules.
 * File: frontend/src/router/index.js
 */

import { createRouter, createWebHistory } from 'vue-router';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';

const Login = () => import('../views/Login.vue');
const DashboardLayout = () => import('../views/DashboardLayout.vue');
const DirectorDashboard = () => import('../views/DirectorDashboard.vue');
const ManagerDashboard = () => import('../views/ManagerDashboard.vue');
const SalesAgentDashboard = () => import('../views/SalesAgentDashboard.vue');
const Procurement = () => import('../views/Procurement.vue');
const ProcurementRecords = () => import('../views/ProcurementRecords.vue');
const Sales = () => import('../views/Sales.vue');
const SalesRecords = () => import('../views/SalesRecords.vue');
const CreditSales = () => import('../views/CreditSales.vue');
const CreditSalesRecords = () => import('../views/CreditSalesRecords.vue');
const Inventory = () => import('../views/Inventory.vue');
const Users = () => import('../views/Users.vue');
const TrustedBuyers = () => import('../views/TrustedBuyers.vue');
const PriceManagement = () => import('../views/PriceManagement.vue');
const Profile = () => import('../views/Profile.vue');

// Route table grouped under dashboard layout with per-route role metadata.
const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'director',
        name: 'DirectorDashboard',
        component: DirectorDashboard,
        meta: { role: 'director' }
      },
      {
        path: 'manager',
        name: 'ManagerDashboard',
        component: ManagerDashboard,
        meta: { role: 'manager' }
      },
      {
        path: 'sales-agent',
        name: 'SalesAgentDashboard',
        component: SalesAgentDashboard,
        meta: { role: 'sales_agent' }
      },
      {
        path: 'procurement',
        name: 'Procurement',
        component: Procurement,
        meta: { role: 'manager' }
      },
      {
        path: 'procurement-records',
        name: 'ProcurementRecords',
        component: ProcurementRecords,
        meta: { role: 'manager' }
      },
      {
        path: 'sales',
        name: 'Sales',
        component: Sales,
        meta: { roles: ['manager', 'sales_agent'] }
      },
      {
        path: 'sales-records',
        name: 'SalesRecords',
        component: SalesRecords,
        meta: { roles: ['manager', 'sales_agent'] }
      },
      {
        path: 'credit-sales',
        name: 'CreditSales',
        component: CreditSales,
        meta: { roles: ['manager', 'sales_agent'] }
      },
      {
        path: 'credit-sales-records',
        name: 'CreditSalesRecords',
        component: CreditSalesRecords,
        meta: { roles: ['manager', 'sales_agent'] }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: Inventory,
        meta: { roles: ['manager', 'sales_agent'] }
      },
      {
        path: 'users',
        name: 'Users',
        component: Users,
        meta: { role: 'manager' }
      },
      {
        path: 'trusted-buyers',
        name: 'TrustedBuyers',
        component: TrustedBuyers,
        meta: { role: 'manager' }
      },
      {
        path: 'price-management',
        name: 'PriceManagement',
        component: PriceManagement,
        meta: { role: 'manager' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile
      }
    ]
  }
];

// Create browser-history router instance.
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard protected routes and reject unauthorized role access early.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(pinia);
  if (!authStore.hydrated) {
    authStore.hydrateFromStorage();
  }

  const userRole = authStore.role;

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/');
  } else if (to.meta.role && userRole !== to.meta.role) {
    next('/');
  } else if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    next('/');
  } else {
    next();
  }
});

export default router;
