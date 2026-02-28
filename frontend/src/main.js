import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Import custom styles
import './assets/style.css';

// Initialize app.
const app = createApp(App);
app.use(router);
app.mount('#app');
