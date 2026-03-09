// Creates the root Pinia container shared by router guards and the mounted Vue app.
 
import { createPinia } from 'pinia';

export const pinia = createPinia();
