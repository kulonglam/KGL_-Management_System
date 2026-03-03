import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { pinia } from './stores';
import { useAuthStore } from './stores/auth';

// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Import custom styles
import './assets/style.css';

// Initialize app.
const app = createApp(App);
app.use(pinia);

const authStore = useAuthStore(pinia);
authStore.hydrateFromStorage();

app.use(router);
app.mount('#app');
