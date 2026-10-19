import { config } from '@vue/test-utils';
import { focusTrap } from '../src/directives/focusTrap.js';
import { translate } from '../src/utils/locale.js';

config.global.directives['focus-trap'] = focusTrap;
config.global.mocks.$t = (label) => translate(label);
