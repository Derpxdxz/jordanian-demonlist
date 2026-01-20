import { fetchPacks, fetchList } from '../content.js';
import Spinner from '../components/Spinner.js';
import { store } from '../main.js';

export default {
    components: { Spinner },
    data: () => ({
        packs: [],
        loading: true,
        err: null,
        store,
        expanded: null, // pack name
        levelMap: {}, // exact name -> { link }
        levelMapLower: {}, // lower-cased name -> { link, name }
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-packs">
            <h1>{{ store.t('Packs') }}</h1>
            <p v-if="err" class="error">{{ err }}</p>
            <div class="packs-grid">
                <button role="button" class="pack-card" v-for="(pack, idx) in packs" :key="pack.name"
                    :class="{ expanded: expanded === pack.name }"
                    :style="{ backgroundColor: pack.color || 'var(--color-background-hover)', color: textColorFor(pack.color) }"
                    @click.prevent="toggle(pack.name)">

                    <div class="pack-compact" v-if="expanded !== pack.name">
                        <div class="pack-compact-center">{{ pack.name }}</div>
                    </div>

                    <div class="pack-expanded" v-if="expanded === pack.name">
                        <h2 class="pack-expanded-title">{{ pack.name }}</h2>
                        <template v-if="pack.levels && pack.levels.length">
                        <ul class="pack-level-list">
                            <li v-for="(level, i) of pack.levels" :key="i">
                                <a :href="linkFor(level)" target="_blank" rel="noopener noreferrer">{{ displayLevel(level) }}</a>
                            </li>
                        </ul>
                        </template>
                        <p v-else class="type-body-muted">{{ store.t('No levels added.') }}</p>
                    </div>

                </button>
            </div>
            <p v-if="packs && packs.length === 0" class="type-body-muted">{{ store.t('No packs to display.') }}</p>
        </main>
    `,
    methods: {
        toggle(name) {
            this.expanded = this.expanded === name ? null : name;
            // Reflect selection in URL so other pages can link directly
            const q = this.expanded ? { pack: this.expanded } : {};
            this.$router.replace({ path: '/packs', query: q }).catch(()=>{});
        },
        linkFor(levelName) {
            if (!levelName) return '#';
            const found = this.levelMap[levelName];
            if (found && found.link) return found.link || '#';
            const foundLower = this.levelMapLower[(levelName || '').toString().trim().toLowerCase()];
            if (foundLower && foundLower.link) return foundLower.link || '#';
            // fallback to data file
            return `/data/${encodeURIComponent(levelName)}.json`;
        },
        displayLevel(levelName) {
            if (!levelName) return '';
            const found = this.levelMap[levelName];
            if (found && found.link) return levelName;
            const foundLower = this.levelMapLower[(levelName || '').toString().trim().toLowerCase()];
            if (foundLower && foundLower.name) return foundLower.name;
            return levelName;
        },
        textColorFor(hex) {
            if (!hex) return 'var(--color-on-background)';
            try {
                let c = hex.replace('#', '').trim();
                if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
                const r = parseInt(c.substr(0,2),16);
                const g = parseInt(c.substr(2,2),16);
                const b = parseInt(c.substr(4,2),16);
                const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                return lum > 180 ? '#000' : '#fff';
            } catch (e) {
                return 'var(--color-on-background)';
            }
        }
    },
    async mounted() {
        try {
            this.packs = await fetchPacks();
            if (!Array.isArray(this.packs)) this.packs = [];

            // Build level name -> link map from the full list (and a lowercase map for tolerant lookups)
            const list = await fetchList();
            (list || []).forEach(([lvl, err]) => {
                if (lvl && lvl.name) {
                    this.levelMap[lvl.name] = { link: lvl.verification || '' };
                    const key = (lvl.name || '').toString().trim().toLowerCase();
                    this.levelMapLower[key] = { link: lvl.verification || '', name: lvl.name };
                }
            });

            // auto-expand if ?pack= set

            // auto-expand if ?pack= set
            const qpack = this.$route && this.$route.query && this.$route.query.pack;
            if (qpack) {
                const found = this.packs.find(p => p.name === qpack);
                if (found) this.expanded = found.name;
            }

        } catch (e) {
            console.error('Failed to load packs or levels', e);
            this.err = this.store.t('Failed to load packs');
            this.packs = [];
        } finally {
            this.loading = false;
        }
    },
};
