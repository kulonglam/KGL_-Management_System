import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import DashboardLayout from '../views/DashboardLayout.vue';
import DirectorDashboard from '../views/DirectorDashboard.vue';
import ManagerDashboard from '../views/ManagerDashboard.vue';
import SalesAgentDashboard from '../views/SalesAgentDashboard.vue';
import Procurement from '../views/Procurement.vue';
import ProcurementRecords from '../views/ProcurementRecords.vue';
import Sales from '../views/Sales.vue';
import CreditSales from '../views/CreditSales.vue';
import CreditSalesRecords from '../views/CreditSalesRecords.vue';
import Inventory from '../views/Inventory.vue';
import Users from '../views/Users.vue';
import TrustedBuyers from '../views/TrustedBuyers.vue';
import PriceManagement from '../views/PriceManagement.vue';
import Profile from '../views/Profile.vue';

// Configure routes.
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

// Configure router.
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (to.meta.requiresAuth && !token) {
    next('/');
  } else if (to.meta.role && user.role !== to.meta.role) {
    next('/');
  } else if (to.meta.roles && !to.meta.roles.includes(user.role)) {
    next('/');
  } else {
    next();
  }
});

export default router;
