import { store } from '../main.js';

export default {
    data: () => ({ store }),
    template: `<p class="spinner">{{ store.t('Loading...') }}</p>`,
};
