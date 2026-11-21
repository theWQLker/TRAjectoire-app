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

/**
 * Display title for an ad (decision 2026-11-20). The France Travail licence
 * forbids altering an offer's content, and the title must keep its gender
 * marker (Code du travail L1142-1). So the ONLY change is removing repeated
 * markers: the first one stays exactly as published, later ones go
 * ("SERVEUR (F/H) (H/F)" → "SERVEUR (F/H)"). Case, accents and wording are
 * untouched; a title with no repeat is returned byte for byte. Listed as a
 * modification wherever offers are shown (OFFER_MODIFICATIONS).
 */
export function cleanOfferTitle(raw: string): string {
  let kept = false;
  let removed = false;
  const t = raw.replace(GENDER_MARKER, (m) => {
    if (!kept) {
      kept = true;
      return m;
    }
    removed = true;
    return "";
  });
  return removed ? t.replace(/ {2,}/g, " ").trim() : raw;
}

/**
 * The original ad on francetravail.fr (decision 2026-11-21). The API's own
 * origineOffre.urlOrigine has this form for France Travail ads (origine 1) and
 * for partner ads (origine 2) alike, checked on live search results 2026-11-21;
 * the cache does not keep urlOrigine, so the link is rebuilt from the id. An ad
 * filled since it was collected opens an empty page there.
 */
export function offerUrl(id: string): string {
  return `https://candidat.francetravail.fr/offres/recherche/detail/${encodeURIComponent(id)}`;
}

/** The changes we make to France Travail offer content, shown with the offers. */
export const OFFER_MODIFICATIONS = "mention (H/F) répétée retirée des intitulés";

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
