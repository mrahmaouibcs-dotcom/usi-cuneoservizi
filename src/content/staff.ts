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
  { name: "Paolo Primerano", role: "Avvocato — Affari giuridici e contenzioso" },
  { name: "Mohamed Rahmaoui", role: "Esperto in affari aziendali e immigrazione" },
  { name: "Staff di supporto", role: "Servizi CAF e Patronato" },
];
