/**
 * Offer (PRD §4). Mirrors the France Travail Offres API v2 response shape.
 * Field names are EXACT so the fixture → live swap is zero-change (PRD §3/§4).
 */
export type Offer = {
  id: string;
  intitule: string; // job title
  romeCode: string;
  typeContrat: string; // CDI, CDD, MIS, etc.
  lieuTravail: { libelle: string; departement: string };
  competences: { code: string; libelle: string; exigence?: string }[];
  // niveauLibelle is the human diploma band ("Bac+2 ou équivalents", "CAP, BEP
  // et équivalents") the FT API actually populates — niveau (the code) is usually
  // absent. The level-demote reads niveauLibelle (§ level-mismatch, 33% coverage).
  formations?: { niveau?: string; niveauLibelle?: string; exigence?: string }[];
  qualitesProfessionnelles?: { libelle: string }[];
  experienceLibelle?: string; // e.g. "2 ans"
  experienceExige?: string; // "D" debutant accepte / "E" exige / "S" souhaite
  permis?: { libelle: string; exigence?: string }[];
  dateCreation: string;
};

// Gender markers employers and France Travail append ("(H/F)", "F/H", "- h/f",
// "H/F/X"…): 16,728 of 16,789 cached titles carry one, often twice. A lone H or
// F letter only, so "Barman/Barmaid" is left alone.
const GENDER_MARKER =
  /\s*[-–]?\s*[(\[]?\s*(?<![\p{L}])[HF]\s*\/\s*[HF](?:\s*\/\s*[XN])?(?![\p{L}])\s*[)\]]?/giu;
// Acronyms kept upper-case when an all-caps title is turned into sentence case.
const ACRONYMS = new Set([
  "RH", "SIRH", "BTP", "IT", "SI", "CDI", "CDD", "SAP", "PME", "VTC", "ERP", "CAP",
  "BTS", "DUT", "QHSE", "QSE", "HSE", "IDE", "EHPAD", "SSIAD", "ASH", "AES", "BEP",
  "CACES", "SSI", "SSIAP", "PL", "SPL", "VL", "TP", "CVC", "IOS", "PHP", "SQL", "BI",
]);

/**
 * Display title for an ad (P0-C): gender markers removed, all-caps titles put in
 * sentence case (known acronyms kept), spacing and stray punctuation tidied.
 * Display only: the stored title is untouched.
 */
export function cleanOfferTitle(raw: string): string {
  let t = raw.replace(GENDER_MARKER, " ");
  t = t.replace(/\(\s*\)|\[\s*\]/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(/^[-–,:;/\s]+|[-–,:;/\s]+$/g, "");
  const letters = t.replace(/[^\p{L}]/gu, "");
  if (letters.length > 3 && letters === letters.toUpperCase()) {
    t = t
      .split(/(\s+|[-/'’(),])/)
      .map((w) => (ACRONYMS.has(w) ? w : w.toLowerCase()))
      .join("");
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }
  return t || "Intitulé non précisé";
}

/**
 * Newest first by publication date (decision 2026-11-20). ISO strings sort
 * lexically; a missing date sorts last. Use with Array.prototype.sort, which is
 * stable, so same-date offers keep their incoming order.
 */
export function newestFirst(a: Offer, b: Offer): number {
  if (a.dateCreation === b.dateCreation) return 0;
  if (!a.dateCreation) return 1;
  if (!b.dateCreation) return -1;
  return b.dateCreation.localeCompare(a.dateCreation);
}
