import routes from './routes.js';

export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) || false,
    lang: localStorage.getItem('lang') || 'en',
    showPopup: true,
    showSubmitForm: false,
    submitForm: {
        levelName: '',
        username: '',
        completion: '',
        modCategory: 'mhv9',
        platform: 'pc',
        raw: '',
        notes: '',
    },
    translations: {
        en: {
            List: 'List',
            Leaderboard: 'Leaderboard',
            Roulette: 'Roulette',
            'Submit Record': 'Submit Record',
            'Search levels...': 'Search levels...',
            'Search users...': 'Search users...',
            'No levels match your search.': 'No levels match your search.',
            'No users match your search.': 'No users match your search.',
            'Points when completed': 'Points when completed',
            'List Editors': 'List Editors',
            'Submission Requirements': 'Submission Requirements',
            Verified: 'Verified',
            Completed: 'Completed',
            Progressed: 'Progressed',
            Records: 'Records',
            Player: 'Player',
            Players: 'Players',
            Cancel: 'Cancel',
            'This level does not accept new records.': 'This level does not accept new records.',
            'Submission Received': 'Submission Received',
            'Submission Success': 'Thank you for your submission! Our review team will evaluate your completion and get back to you soon.',

            // Submit form labels
            'Level Name': 'Level Name',
            'Username': 'Username',
            'Completion Link': 'Completion Link',
            'Mod Category': 'Mod Category',
            'Platform': 'Platform',
            'Raw Footage (optional)': 'Raw Footage (optional)',
            'Notes (optional)': 'Notes (optional)',
            'Mega Hack v9': 'Mega Hack v9',
            'Mega Hack v8': 'Mega Hack v8',
            'Mega Hack v7': 'Mega Hack v7',
            'Eclipse': 'Eclipse',
            'QOL Mod': 'QOL Mod',
            'Vanilla': 'Vanilla',
            'Other': 'Other',
            'PC': 'PC',
            'Mobile': 'Mobile',
            'Watch on YouTube': 'Watch on YouTube',
            'Happy new year everyone!': 'Happy new year everyone!',
            'Wrap Up Promo': 'with the end of 2025, a wrap up video of the Demonlist got released!',
            'Submission ID': 'Submission ID',

            // general UI
            'Loading...': 'Loading...',
            'The Arab Demonlist': 'The Arab Demonlist',

            // Level Authors
            'Creator & Verifier': 'Creator & Verifier',
            'Creator': 'Creator',
            'Verifier': 'Verifier',
            'Creators': 'Creators',
            'Publisher': 'Publisher',

            // Roulette
            'Shameless copy of the Extreme Demon Roulette by': 'Shameless copy of the Extreme Demon Roulette by',
            'Main List': 'Main List',
            'Extended List': 'Extended List',
            'Start': 'Start',
            'Restart': 'Restart',
            'The roulette saves automatically.': 'The roulette saves automatically.',
            'Manual Load/Save': 'Manual Load/Save',
            'Import': 'Import',
            'Export': 'Export',
            'Done': 'Done',
            'Give Up': 'Give Up',
            'Results': 'Results',
            'Number of levels:': 'Number of levels:',
            'Highest percent:': 'Highest percent:',
            'Show remaining levels': 'Show remaining levels',
            'Give up before starting a new roulette.': 'Give up before starting a new roulette.',
            'List is currently broken. Wait until it\'s fixed to start a roulette.': 'List is currently broken. Wait until it\'s fixed to start a roulette.',

            // Leaderboard errors
            'Leaderboard may be incorrect, as the following levels could not be loaded:': 'Leaderboard may be incorrect, as the following levels could not be loaded:',
            'Leaderboard load timed out': 'Leaderboard load timed out',
            'Failed to load leaderboard': 'Failed to load leaderboard',

            // Submission Requirements
            'Requirement 1 Title': '1. Audible Clicks',
            'Requirement 1 Text 1': 'Your completion video and your raw footage must contain clearly audible mouse/keyboard clicks for the entire run.',
            'Requirement 1 Text 2': 'The clicks must not be muted, filtered out, or completely drowned by background noise.',
            'Requirement 2 Title': '2. Upload of the Completion Video',
            'Requirement 2 Text': 'You must upload your completion to YouTube or any other major public video-sharing platform.',
            'Requirement 3 Title': '3. Cheat Indicators & CPS Counter',
            'Requirement 3 Text': 'If you are using Megahack or any other mod client, your video must clearly show a cheat indicator, a CPS Counter, & an FPS Counter throughout the entire run.',
            'Requirement 4 Title': '4. No Use of Disallowed hacks',
            'Requirement 4 Text': 'Any hacks that are considered forbidden by Pointercrate and AREDL may not be used. Only approved cosmetic or QoL mods are allowed.',
            'Requirement 5 Title': '5. Pointercrate & AREDL',
            'Requirement 5 Text': 'If your completion is already accepted on Pointercrate or AREDL, your completion will be accepted automatically. When submitting a record for a level that is placed on the Pointercrate Demonlist, your record must be accepted on Pointercrate to be accepted on the Arab Demonlist',

            'At least': 'At least'
        },
    },
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },
    toggleLang() {
        this.lang = this.lang === 'en' ? 'ar' : 'en';
        localStorage.setItem('lang', this.lang);
        // Set document direction for Arabic
        if (this.lang === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
        }
    },
    t(key) {
        return (this.translations[this.lang] && this.translations[this.lang][key]) || key;
    },
    openSubmitForm() {
        this.showSubmitForm = true;
    },
    closeSubmitForm() {
        this.showSubmitForm = false;
    },
    async submitRecord() {
        // simple client-side validation
        const payload = { ...this.submitForm };
        try {
            const res = await fetch('/api/submit-record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.ok) {
                const message = this.t('Submission Success') + (data.id ? '\nSubmission ID: ' + data.id : '');
                alert(message);
                console.debug('Submission ID:', data.id);
                this.showSubmitForm = false;
                // reset form
                this.submitForm = {
                    levelName: '',
                    username: '',
                    completion: '',
                    modCategory: 'mhv9',
                    platform: 'pc',
                    raw: '',
                    notes: '',
                };
            } else {
                alert('Submission failed');
            }
        } catch (e) {
            console.error(e);
            alert('Submission failed');
        }
    },
    closePopup() {
        this.showPopup = false;
    },
});

const app = Vue.createApp({
    data: () => ({ store }),
});
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);

app.mount('#app');

// Ensure document direction matches stored language on initial load
if (store.lang === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
} else {
    document.documentElement.setAttribute('dir', 'ltr');
}

// close the promo popup on Escape for convenience
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && store.showPopup) {
        store.closePopup();
    }
});
