import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = 'data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchPacks() {
    try {
        const packsResults = await fetch(`${dir}/_packs.json`);
        const packs = await packsResults.json();
        return packs || [];
    } catch {
        return [];
    }
}

export async function fetchPlayers() {
    try {
        const playersResults = await fetch(`${dir}/_players.json`);
        const players = await playersResults.json();
        return players.players || [];
    } catch {
        return [];
    }
}

export async function fetchLeaderboard() {
    console.debug('fetchLeaderboard called');
    const list = await fetchList();
    const players = await fetchPlayers();
    const packs = await fetchPacks();

    if (!list) {
        // If list failed to load, return empty leaderboard and an error so UI can show a message
        console.warn('fetchLeaderboard: list is null');
        return [[], ['Failed to load level list']];
    }

    const scoreMap = {};
    const errs = [];
    const verifiers = new Set();
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Collect verifiers (guard missing verifier)
        const vLower = (level.verifier || '').toLowerCase();
        if (vLower) verifiers.add(vLower);

        // Verification (use existing casing if available)
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === vLower,
        ) || level.verifier || 'Unknown';
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        level.records.forEach((record) => {
            const rUserLower = (record.user || '').toLowerCase();
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === rUserLower,
            ) || record.user || 'Unknown';
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
            });
        });
    });

    // Wrap in extra Object containing the user and total score, and compute pack bonuses
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const baseTotal = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        // Determine completed level names (verified OR completed count as finished)
        const finishedSet = new Set([
            ...(verified || []).map(v => (v.level || '').toString().trim().toLowerCase()),
            ...(completed || []).map(c => (c.level || '').toString().trim().toLowerCase()),
        ].filter(Boolean));

        const packsCompleted = [];
        (packs || []).forEach(pack => {
            const packLevels = (pack.levels || [])
                .map(l => (l || '').toString().trim().toLowerCase())
                .filter(Boolean);
            if (packLevels.length === 0) return; // ignore packs with no valid levels
            const allFinished = packLevels.every(l => finishedSet.has(l));
            if (allFinished) {
                packsCompleted.push(pack.name);
            }
        });

        return {
            user,
            total: round(baseTotal),
            packs: packsCompleted,
            ...scores,
        };
    });

    // Filter out verifiers from leaderboard, except allowlisted names
    const allowedVerifiers = new Set(['gmdelite', 'blankb']);
    const filteredRes = res.filter(entry => {
        const userLower = entry.user.toLowerCase();
        if (allowedVerifiers.has(userLower)) return true;
        return !verifiers.has(userLower);
    });

    // Sort by total score and assign dense ranks
    const sorted = filteredRes.sort((a, b) => b.total - a.total);
    let currentRank = 0;
    let lastTotal = null;
    for (const entry of sorted) {
        if (lastTotal === null || entry.total !== lastTotal) {
            currentRank += 1;
            lastTotal = entry.total;
        }
        entry.rank = currentRank;
    }

    // Map countries to users
    const playerMap = {};
    players.forEach(player => {
        playerMap[player.name.toLowerCase()] = player.country;
    });
    sorted.forEach(entry => {
        entry.country = playerMap[entry.user.toLowerCase()] || null;
    });

    return [sorted, errs];
}
