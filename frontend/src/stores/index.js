/**
 * Creates the root Pinia container shared by router guards and the mounted Vue app.
 * File: frontend/src/stores/index.js
 */
import { createPinia } from 'pinia';

export const pinia = createPinia();

export default pinia;

