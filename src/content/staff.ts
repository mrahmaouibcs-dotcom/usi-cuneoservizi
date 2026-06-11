export type StaffMember = {
  name: string;
  role: string;
  /** Lingue parlate (sigle che compaiono come badge). Facoltativo. */
  langs?: string[];
  /** Percorso foto in /public (es. "/staff/mohamed.jpg"). Se assente, mostra le iniziali. */
  photo?: string;
};

/**
 * Staff responsabile + supporto.
 * Per le foto: metti i file in usi-cuneoservizi/public/staff/ e indica il percorso in "photo".
 * Le lingue parlate sono facoltative: aggiungile quando disponibili (es. langs: ["IT","AR"]).
 */
export const staff: StaffMember[] = [
  { name: "Giuseppe Folino", role: "Esperto in affari sindacali" },
  { name: "Paolo Primerano", role: "Avvocato — Diritto dell'immigrazione e cittadinanza italiana" },
  { name: "Mohamed Rahmaoui", role: "Esperto in affari aziendali, imprese e partita IVA · Esame di lingua italiana" },
  { name: "Staff di supporto", role: "Servizi CAF e Patronato" },
  { name: "Avv. De Bellis Alessandro", role: "Studio legale convenzionato · Consulenza e assistenza legale" },
];
