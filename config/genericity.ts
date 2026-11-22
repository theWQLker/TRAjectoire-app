/**
 * Genericity bound for vocabulary (decision 2026-11-22: seeds and answers carry
 * domain-concentrated codes only). A competence code listed by jobs in more
 * than MAX_CODE_DOMAINES of the 110 ROME domaines professionnels is a
 * macro-competence, not the vocabulary of a niche.
 *
 * Why 10 (measured on the live graph, 1,923 jobs, 32,229 codes, 2026-11-22):
 *   - 98% of all codes are listed in 10 domaines or fewer; the 2% above are the
 *     transversal macro-competences (« Rendre compte de son activité » 36,
 *     « Respecter des règles, des consignes » 43, « Gérer des réclamations » 28);
 *   - the widest seed niche spans 2 domaines. For seed codes listed in 9-10
 *     domaines the niche's own jobs are 11% of the jobs listing them on average;
 *     above 10 that falls to 8%, then 6%, 4%, 3%: such a code mostly describes
 *     jobs outside the niche that seeds it;
 *   - cutting there keeps every niche in its seeded top 10 (family presence
 *     51/51) and no niche's best rank gets worse.
 * Used by scripts/build-families.ts (seed filter) and scripts/seed-leak-guard.ts
 * (which fails on any seed code above it). One bound for every depth.
 */
export const MAX_CODE_DOMAINES = 10;
