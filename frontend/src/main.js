// Frontend bootstrap entry: mounts Vue, Pinia, router, and global styles.
 
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { pinia } from './stores';
import { useAuthStore } from './stores/auth';
import { installCustomValidationMessages } from './utils/customValidationMessages.js';

// Load vendor styles used by shared UI components.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Load application-level custom styling overrides.
import './assets/style.css';

// Create app instance and register shared plugins before mount.
const app = createApp(App);
app.use(pinia);
installCustomValidationMessages();

const authStore = useAuthStore(pinia);
authStore.hydrateFromStorage();

app.use(router);
app.mount('#app');
