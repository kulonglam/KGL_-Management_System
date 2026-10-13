import { config } from '@vue/test-utils';
import { focusTrap } from '../src/directives/focusTrap.js';

config.global.directives['focus-trap'] = focusTrap;
