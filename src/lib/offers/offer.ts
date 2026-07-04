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
