import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList, fetchPlayers } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">

            <div class="list-container">
                <form class="search-bar" @submit.prevent>
                    <input name="list-search" id="list-search" :placeholder="store.t('Search levels...')" v-model="searchQuery" @input="onSearchInput">
                    <button class="search-btn" @click.prevent="clearSearch" aria-label="Clear search">✕</button>
                </form>
                <table class="list" v-if="list && filteredList.length > 0">
                    <tr v-for="({ entry: [level, err], idx }, i) in filteredList">
                        <td class="rank">
                            <p v-if="idx + 1 <= 150" class="type-label-lg">#{{ idx + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == idx, 'error': !level }">
                            <button @click="selected = idx">
                                <span class="type-label-lg">{{ (level && level.name) ? level.name : ('Error (' + err + '.json)') }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
                <p v-else class="type-body-muted">{{ store.t('No levels match your search.') }}</p>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">{{ store.t('Points when completed') }}</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>{{ store.t('Records') }}</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> {{ store.lang === 'ar' ? 'أو أفضل للتأهل' : 'or better to qualify' }}</p>
                    <p v-else-if="selected +1 <= 150"><strong>100%</strong> {{ store.lang === 'ar' ? 'أو أفضل للتأهل' : 'or better to qualify' }}</p>
                    <p v-else>{{ store.t('This level does not accept new records.') }}</p>
                    <table class="records">
                        <tr v-for="record in visibleRecords" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="flag">
                                <img v-if="getPlayerFlag(record.user)" :src="getPlayerFlag(record.user)" :alt="record.user" class="flag inline-flag">
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>

                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <template v-if="filteredEditors && filteredEditors.length">
                        <h3>{{ store.t('List Editors') }}</h3>
                        <ol class="editors">
                            <li v-for="editor in filteredEditors">
                                <div class="editor-icons">
                                    <img
                                        v-for="role in rolesFor(editor)"
                                        :key="role"
                                        :src="\`assets/\${roleIconMap[role]}\${store.dark ? '-dark' : ''}.svg\`"
                                        :alt="role"
                                    >
                                </div>
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>{{ store.t('Submission Requirements') }}</h3><br>
                    <h5>
                    {{ store.t('Requirement 1 Title') }}
                    </h5>
                    <p>
                    {{ store.t('Requirement 1 Text 1') }}
                    </p>
                    <p>
                    {{ store.t('Requirement 1 Text 2') }}
                    </p>
                    <br>
                    <h5>
                    {{ store.t('Requirement 2 Title') }}
                    </h5>
                    <p>
                    {{ store.t('Requirement 2 Text') }}
                    </p>
                    <br>
                    <h5>
                    {{ store.t('Requirement 3 Title') }}
                    </h5>
                    <p>
                    {{ store.t('Requirement 3 Text') }}
                    </p>
                    <br>
                    <h5>
                    {{ store.t('Requirement 4 Title') }}
                    </h5>
                    <p>
                    {{ store.t('Requirement 4 Text') }}
                    </p>
                    <br>
                    <h5>
                    {{ store.t('Requirement 5 Title') }}
                    </h5>
                    <p>
                    {{ store.t('Requirement 5 Text') }}
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        players: [],
        playerMap: {},
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
        searchQuery: ''
    }),
    computed: {
        // Safe access to current level
        level() {
            return this.list && this.list[this.selected] ? this.list[this.selected][0] : null;
        },
        video() {
            if (!this.level) return '';
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },

        // Filtered list preserves original indices so `selected` can still reference the full list
        filteredList() {
            if (!this.list) return [];
            const q = this.searchQuery.trim().toLowerCase();
            return this.list
                .map((entry, idx) => ({ entry, idx }))
                .filter(({ entry: [level, err] }) => {
                    if (!q) return true;
                    if (!level) return false;
                    const name = (level.name || '').toLowerCase();
                    const author = (level.author || '').toLowerCase();
                    const verifier = (level.verifier || '').toLowerCase();
                    return (
                        name.includes(q) ||
                        author.includes(q) ||
                        verifier.includes(q)
                    );
                });
        },

        // Hide records with empty or missing user names
        visibleRecords() {
            if (!this.level || !Array.isArray(this.level.records)) return [];
            return this.level.records.filter(r => r.user && r.user.toString().trim() !== '');
        },

        // Hide editors without a name
        filteredEditors() {
            if (!this.editors) return null;
            return this.editors.filter(e => e.name && e.name.toString().trim() !== '');
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();
        // Load players to map usernames to countries for inline flags (optional)
        try {
            this.players = await fetchPlayers();
            (this.players || []).forEach(p => {
                if (p && p.name) this.playerMap[(p.name || '').toLowerCase()] = p.country || null;
            });
        } catch (e) {
            // ignore - flags are cosmetic
        }

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        getFlag(country) {
            const countryCodes = {
                'Jordan': 'jo',
                'United Arab Emirates': 'ae',
                'Bahrain': 'bh',
                'Djibouti': 'dj',
                'Algeria': 'dz',
                'Egypt': 'eg',
                'Iraq': 'iq',
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
            const country = this.playerMap[(user || '').toLowerCase()];
            return country ? this.getFlag(country) : null;
        },

        onSearchInput() {
            // If current selection is filtered out, pick the first visible entry
            const ids = this.filteredList.map(x => x.idx);
            if (ids.length > 0 && !ids.includes(this.selected)) {
                this.selected = ids[0];
            }
        },
        clearSearch() {
            this.searchQuery = '';
            // Restore selection to first item if necessary
            if (this.list && this.list.length && (this.selected < 0 || this.selected >= this.list.length)) {
                this.selected = 0;
            }
        },
        rolesFor(editor) {
            if (Array.isArray(editor.roles) && editor.roles.length > 0) {
                return editor.roles;
            }

            return editor.role ? [editor.role] : [];
        },
    },
};
