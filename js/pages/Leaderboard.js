import { fetchLeaderboard, fetchPacks } from '../content.js';
import { localize } from '../util.js';
import { store } from '../main.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        selectedCountry: null,
        err: [],
        searchQuery: '',
        view: 'players',
        store,
        packsList: [],
        countryView: 'levels'
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        {{ store.t('Leaderboard may be incorrect, as the following levels could not be loaded:') }} {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <div class="view-tabs" role="tablist" aria-label="Leaderboard view">
                        <button type="button" :class="{ 'active': view === 'players' }" @click.prevent="view = 'players'">{{ store.t('Players') }}</button>
                        <button type="button" :class="{ 'active': view === 'countries' }" @click.prevent="view = 'countries'">{{ store.t('Countries') }}</button>
                    </div>

                    <form class="search-bar" v-if="view === 'players'" @submit.prevent>
                        <input name="leaderboard-search" id="leaderboard-search" :placeholder="store.t('Search users...')" v-model="searchQuery" @input="onSearchInput">
                        <button class="search-btn" @click.prevent="clearSearch" aria-label="Clear search">✕</button>
                    </form>

                    <template v-if="view === 'players'">
                        <table class="board" v-if="filteredLeaderboard && filteredLeaderboard.length > 0">
                            <tr v-for="({ item: ientry, idx }, i) in filteredLeaderboard">
                                <td class="rank">
                                    <p class="type-label-lg">#{{ ientry.rank }}</p>
                                </td>
                                <td class="total">
                                    <p class="type-label-lg">{{ localize(ientry.total) }}</p>
                                </td>
                                <td class="user" :class="{ 'active': selected == idx }">
                                    <button @click="selected = idx">
                                        <span class="type-label-lg">
                                            <img v-if="getFlag(ientry.country)" :src="getFlag(ientry.country)" :alt="ientry.country" class="flag">
                                            {{ ientry.user }}
                                        </span>
                                    </button>
                                </td>
                            </tr>
                        </table>
                        <p v-else class="type-body-muted">{{ store.t('No users match your search.') }}</p>
                    </template>

                    <template v-if="view === 'countries'">
                        <table class="board" v-if="countries && countries.length > 0">
                            <tr v-for="country in countries" :class="{ 'active-country': selectedCountry === country.country }">
                                <td class="rank">
                                    <p class="type-label-lg">#{{ country.rank }}</p>
                                </td>
                                <td class="total">
                                    <p class="type-label-lg">{{ localize(country.total) }}</p>
                                </td>
                                <td class="players">
                                    <p class="type-label-lg">{{ country.playerCount }}</p>
                                </td>
                                <td class="country">
                                    <button class="country-btn" @click.prevent="selectCountry(country.country)">
                                        <span class="type-label-lg">
                                            <img v-if="getFlag(country.country)" :src="getFlag(country.country)" :title="country.country" :alt="country.country" class="flag">
                                            <span class="country-name">{{ country.country }}</span>
                                        </span>
                                    </button>
                                </td>
                            </tr>
                        </table>
                        <p v-else class="type-body-muted">{{ store.t('No countries to display.') }}</p>
                    </template>
                </div>

                <div class="player-container">
                    <div :class="['player', { 'country-profile': view === 'countries' && countryEntry } ]">
                        <template v-if="view === 'players'">
                            <h1>#{{ entry.rank }} <img v-if="getFlag(entry.country)" :src="getFlag(entry.country)" alt="flag" class="flag"> {{ entry.user }}</h1>
                            <h3>{{ entry.total }}</h3>
                            <h2 v-if="entry.verified.length > 0">{{ store.t('Verified') }} ({{ entry.verified.length}})</h2>
                            <table class="table">
                                <tr v-for="score in entry.verified">
                                    <td class="rank">
                                        <p>#{{ score.rank }}</p>
                                    </td>
                                    <td class="level">
                                        <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                    </td>
                                    <td class="score">
                                        <p>+{{ localize(score.score) }}</p>
                                    </td>
                                </tr>
                            </table>
                            <h2 v-if="entry.completed.length > 0">{{ store.t('Completed') }} ({{ entry.completed.length }})</h2>
                            <table class="table">
                                <tr v-for="score in entry.completed">
                                    <td class="rank">
                                        <p>#{{ score.rank }}</p>
                                    </td>
                                    <td class="level">
                                        <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                    </td>
                                    <td class="score">
                                        <p>+{{ localize(score.score) }}</p>
                                    </td>
                                </tr>
                            </table>
                            <h2 v-if="entry.progressed.length > 0">{{ store.t('Progressed') }} ({{entry.progressed.length}})</h2>
                            <table class="table">
                                <tr v-for="score in entry.progressed">
                                    <td class="rank">
                                        <p>#{{ score.rank }}</p>
                                    </td>
                                    <td class="level">
                                        <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                    </td>
                                    <td class="score">
                                        <p>+{{ localize(score.score) }}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Packs section: show packs the player completed -->
                            <h2>{{ store.t('Packs') }} ({{ (entry.packs || []).length }})</h2>
                            <table class="table" v-if="entry.packs && entry.packs.length > 0">
                                <tr v-for="packName in entry.packs">
                                    <td class="level">
                                        <a class="type-label-lg" :href="packLink(packName)" target="_self">{{ packName }}</a>
                                    </td>
                                </tr>
                            </table>
                            <p v-else class="type-body-muted">{{ store.t('No packs completed.') }}</p>
                        </template>

                        <template v-else-if="view === 'countries'">
                            <div v-if="selectedCountry">
                                <h1>#{{ countryEntry.rank }} <img v-if="getFlag(countryEntry.country)" :src="getFlag(countryEntry.country)" :alt="countryEntry.country" class="flag"> {{ countryEntry.country }}</h1>
                                <h3>{{ countryEntry.total }}</h3>
                                <p class="players-info">{{ countryEntry.playerCount }} {{ countryEntry.playerCount === 1 ? store.t('Player') : store.t('Players') }}</p>
                                <button v-if="countryView === 'levels'" class="country-leaderboard-btn" @click="countryView = 'players'">{{ selectedCountry }}'s Leaderboard</button>
                                <div v-if="countryView === 'levels'">
                                    <h2 v-if="countryEntry.verified.length > 0">{{ store.t('Verified') }} ({{ countryEntry.verified.length}})</h2>
                                    <table class="table">
                                        <tr v-for="score in countryEntry.verified">
                                            <td class="rank">
                                                <p>#{{ score.rank }}</p>
                                            </td>
                                            <td class="level">
                                                <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                            </td>
                                            <td class="score">
                                                <p>+{{ localize(score.score) }}</p>
                                            </td>
                                            <td class="user">
                                                <p>
                                                    <template v-for="(u, idx) in (score.users || [score.user])">
                                                        <img v-if="getPlayerFlag(u)" :src="getPlayerFlag(u)" :alt="u" class="inline-flag">
                                                        <span class="user-name">{{ u }}</span><span v-if="idx < ((score.users || [score.user]).length - 1)">, </span>
                                                    </template>
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <h2 v-if="countryEntry.completed.length > 0">{{ store.t('Completed') }} ({{ countryEntry.completed.length }})</h2>
                                    <table class="table">
                                        <tr v-for="score in countryEntry.completed">
                                            <td class="rank">
                                                <p>#{{ score.rank }}</p>
                                            </td>
                                            <td class="level">
                                                <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                            </td>
                                            <td class="score">
                                                <p>+{{ localize(score.score) }}</p>
                                            </td>
                                            <td class="user">
                                                <p>
                                                    <template v-for="(u, idx) in (score.users || [score.user])">
                                                        <img v-if="getPlayerFlag(u)" :src="getPlayerFlag(u)" :alt="u" class="inline-flag">
                                                        <span class="user-name">{{ u }}</span><span v-if="idx < ((score.users || [score.user]).length - 1)">, </span>
                                                    </template>
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <h2 v-if="countryEntry.progressed.length > 0">{{ store.t('Progressed') }} ({{countryEntry.progressed.length}})</h2>
                                    <table class="table">
                                        <tr v-for="score in countryEntry.progressed">
                                            <td class="rank">
                                                <p>#{{ score.rank }}</p>
                                            </td>
                                            <td class="level">
                                                <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                            </td>
                                            <td class="score">
                                                <p>+{{ localize(score.score) }}</p>
                                            </td>
                                            <td class="user">
                                                <p>
                                                    <template v-for="(u, idx) in (score.users || [score.user])">
                                                        <img v-if="getPlayerFlag(u)" :src="getPlayerFlag(u)" :alt="u" class="inline-flag">
                                                        <span class="user-name">{{ u }}</span><span v-if="idx < ((score.users || [score.user]).length - 1)">, </span>
                                                    </template>
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <div v-if="countryView === 'players'">
                                    <button class="country-leaderboard-btn" @click="countryView = 'levels'">Go back</button>
                                    <table class="board" v-if="countryPlayers && countryPlayers.length > 0">
                                        <tr v-for="(player, idx) in countryPlayers" :key="player.user">
                                            <td class="rank">
                                                <p class="type-label-lg">#{{ idx + 1 }}</p>
                                            </td>
                                            <td class="total">
                                                <p class="type-label-lg">{{ localize(player.total) }}</p>
                                            </td>
                                            <td class="user">
                                                <button @click="selected = this.leaderboard.indexOf(player); view = 'players'">
                                                    <span class="type-label-lg">{{ player.user }}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    </table>
                                    <p v-else class="type-body-muted">{{ store.t('No players to display.') }}</p>
                                </div>
                            </div>
                            <p v-else class="type-body-muted">{{ store.t('Select a country to see its profile.') }}</p>
                        </template>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return this.leaderboard && this.leaderboard[this.selected] ? this.leaderboard[this.selected] : { user: '', total: 0, verified: [], completed: [], progressed: [], rank: '' };
        },

        // Only search users (not totals or other fields)
        filteredLeaderboard() {
            if (!this.leaderboard) return [];
            const q = this.searchQuery.trim().toLowerCase();
            return this.leaderboard
                .map((item, idx) => ({ item, idx }))
                .filter(({ item }) => {
                    if (!q) return true;
                    return item.user && item.user.toLowerCase().includes(q);
                });
        },

        countries() {
            if (!this.leaderboard) return [];
            const countryMap = {};
            const countryPlayers = {};
            this.leaderboard.forEach(entry => {
                if (entry.country) {
                    if (!countryMap[entry.country]) {
                        countryMap[entry.country] = 0;
                        countryPlayers[entry.country] = 0;
                    }
                    countryMap[entry.country] += entry.total;
                    countryPlayers[entry.country]++;
                }
            });
            const countries = Object.entries(countryMap).map(([country, total]) => ({
                country,
                total,
                playerCount: countryPlayers[country]
            }));
            countries.sort((a, b) => b.total - a.total);
            let rank = 1;
            let lastTotal = null;
            countries.forEach(country => {
                if (lastTotal === null || country.total !== lastTotal) {
                    country.rank = rank++;
                    lastTotal = country.total;
                } else {
                    country.rank = rank - 1;
                }
            });
            return countries;
        },

        countryPlayers() {
            if (!this.selectedCountry || !this.leaderboard) return [];
            return this.leaderboard.filter(e => e.country === this.selectedCountry).sort((a, b) => b.total - a.total);
        },

        countryEntry() {
            if (!this.selectedCountry || !this.leaderboard) return null;
            const entries = this.leaderboard.filter(e => e.country === this.selectedCountry);
            if (!entries.length) return null;
            const result = {
                country: this.selectedCountry,
                total: 0,
                playerCount: entries.length,
                rank: (this.countries.find(c => c.country === this.selectedCountry) || {}).rank || '',
                verified: [],
                completed: [],
                progressed: []
            };
            entries.forEach(e => {
                result.total += e.total || 0;
                (e.verified || []).forEach(s => result.verified.push(Object.assign({}, s, { user: e.user })));
                (e.completed || []).forEach(s => result.completed.push(Object.assign({}, s, { user: e.user })));
                (e.progressed || []).forEach(s => result.progressed.push(Object.assign({}, s, { user: e.user })));
            });

            const groupLevels = (arr) => {
                const map = {};
                arr.forEach(item => {
                    // Prefer grouping by level name so multiple records for the same level collapse,
                    // even if their links differ (different submissions).
                    const key = item.level || item.link || (item.rank + '_' + (item.level || ''));
                    if (!map[key]) {
                        map[key] = Object.assign({}, item, { users: item.user ? [item.user] : [] });
                    } else {
                        // keep highest score if there are differences
                        if (parseFloat(item.score || 0) > parseFloat(map[key].score || 0)) {
                            map[key].score = item.score;
                            if (item.link) map[key].link = item.link; // prefer an explicit link if available
                        }
                        if (item.user && !map[key].users.includes(item.user)) {
                            map[key].users.push(item.user);
                        }
                    }
                });
                return Object.values(map).sort((a, b) => (a.rank || 0) - (b.rank || 0));
            };

            result.verified = groupLevels(result.verified);
            result.completed = groupLevels(result.completed);
            // For progressed, also group by level (combine users)
            result.progressed = groupLevels(result.progressed);
            return result;
        },
    },
    async mounted() {
        console.debug('Leaderboard component mounted — fetching leaderboard');
        // Fallback timer: if fetch takes too long, show timeout error and stop spinner
        const timer = setTimeout(() => {
            if (this.loading) {
                console.warn('Leaderboard fetch timed out');
                this.err = [...(this.err || []), this.store.t('Leaderboard load timed out')];
                this.leaderboard = [];
                this.loading = false;
            }
        }, 8000);

        try {
            const [leaderboard, err] = await fetchLeaderboard();
            console.debug('fetchLeaderboard result', { leaderboardLength: leaderboard?.length, err });
            this.leaderboard = leaderboard || [];
            this.err = err || [];
        } catch (e) {
            console.error('Failed to fetch leaderboard', e);
            this.leaderboard = [];
            this.err = [e.message || this.store.t('Failed to load leaderboard')];
        } finally {
            clearTimeout(timer);
            // Hide loading spinner
            this.loading = false;
        }

        // load packs list for profile display
        try {
            this.packsList = await fetchPacks();
        } catch (e) {
            // non-fatal
            console.warn('Failed to load packs list', e);
            this.packsList = [];
        }
    },

    methods: {
        localize,
        onSearchInput() {
            const ids = this.filteredLeaderboard.map(x => x.idx);
            if (ids.length > 0 && !ids.includes(this.selected)) {
                this.selected = ids[0];
            }
        },
        clearSearch() {
            this.searchQuery = '';
            if (this.leaderboard && this.leaderboard.length && (this.selected < 0 || this.selected >= this.leaderboard.length)) {
                this.selected = 0;
            }
            // Clearing search should not change country selection
        },
        selectCountry(country) {
            this.selectedCountry = country;
            this.countryView = 'levels';
            // deselect player when a country is selected
            this.selected = -1;
        },
        getFlag(country) {
            const countryCodes = {
                'Jordan': 'jo',
                'United Arab Emirates': 'ae',
                'Bahrain': 'bh',
                'Djibouti': 'dj',
                'Algeria': 'dz',
                'Egypt': 'eg',
                'Iraq': 'iq',
                'Jordan': 'jo',
                'Comoros': 'km',
                'Kuwait': 'kw',
                'Lebanon': 'lb',
                'Libya': 'ly',
                'Morocco': 'ma',
                'Mauritania': 'mr',
                'Oman': 'om',
                'Palestine': 'ps',
                'Qatar': 'qa',
                'Saudi Arabia': 'sa',
                'Sudan': 'sd',
                'Syria': 'sy',
                'Tunisia': 'tn',
                'Yemen': 'ye',
                "Somalia": 'so',
            };
            const code = countryCodes[country];
            return code ? `/assets/Flags/${code}.svg` : null;
        },

        getPlayerFlag(user) {
            if (!user || !this.leaderboard) return null;
            const uLower = (user || '').toLowerCase();
            const entry = this.leaderboard.find(e => (e.user || '').toLowerCase() === uLower);
            return entry && entry.country ? this.getFlag(entry.country) : null;
        },

        // Packs helpers for player profile
        packLink(packName) {
            return `/packs?pack=${encodeURIComponent(packName)}`;
        },


    },
};
