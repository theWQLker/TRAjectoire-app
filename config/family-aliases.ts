/**
 * Stored seed tokens that no longer name a depth (decision 2026-11-23, family
 * split). Sessions keep the tokens they were saved with, so each old token is
 * resolved here before the seed is built. A depth token maps to its new token
 * with identical codes; the bare family value `services` maps to every depth
 * the old family held. Keys are tokens as stored in answers.seed_families and
 * in answers.seed_exclusions ("token=ROME,ROME").
 */
export const FAMILY_ALIASES: Readonly<Record<string, readonly string[]>> = {
  // « Services à la personne & collectivité » split into four families.
  "services:social": ["social:social"],
  "services:enseignement": ["social:enseignement"],
  "services:domicile": ["social:domicile"],
  "services:territoire": ["social:territoire"],
  "services:securite": ["securite:securite"],
  "services:proprete": ["proprete:proprete"],
  services: [
    "social:social",
    "social:enseignement",
    "social:domicile",
    "social:territoire",
    "securite:securite",
    "proprete:proprete",
  ],
  // « Droit » is its own family, made from the admin depth.
  "admin:juridique": ["droit:juridique"],
};
