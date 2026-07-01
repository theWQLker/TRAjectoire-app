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
  formations?: { niveau?: string; exigence?: string }[];
  qualitesProfessionnelles?: { libelle: string }[];
  experienceLibelle?: string; // e.g. "2 ans"
  experienceExige?: string; // "D" debutant accepte / "E" exige / "S" souhaite
  permis?: { libelle: string; exigence?: string }[];
  dateCreation: string;
};
