// Settori di lavoro disponibili per la registrazione
export const workFields = [
  { id: "studio-progettazione", name: "Studio Progettazione" },
  { id: "carpenteria-metallica", name: "Carpenteria Metallica" },
  { id: "edilizia", name: "Edilizia" },
  { id: "meccanica-precisione", name: "Meccanica Precisione" },
  { id: "impiantistica", name: "Impiantistica" },
  { id: "falegnameria", name: "Falegnameria" },
  { id: "serramenti", name: "Serramenti" },
  { id: "manutenzione-verde", name: "Manutenzione Verde" },
  { id: "lattoneria", name: "Lattoneria" },
  { id: "automazione", name: "Automazione" },
  { id: "altro", name: "Altro" },
] as const;

export type WorkFieldId = typeof workFields[number]["id"];

// Preset di Attivita e Componenti per ogni settore
export const workFieldPresets: Record<WorkFieldId, { activities: string[]; components: string[] }> = {
  "studio-progettazione": {
    activities: ["Progettazione", "Rilievo", "Sopralluogo", "Assistenza Cantiere", "Pratiche"],
    components: ["Carta", "Cancelleria", "Software", "Licenze"],
  },
  "carpenteria-metallica": {
    activities: ["Taglio", "Saldatura", "Montaggio", "Verniciatura", "Piegatura"],
    components: ["Profilati", "Lamiere", "Bulloneria", "Vernice", "Saldatura"],
  },
  "edilizia": {
    activities: ["Muratura", "Intonaco", "Piastrellatura", "Demolizione", "Scavo"],
    components: ["Cemento", "Mattoni", "Sabbia", "Piastrelle", "Ferro"],
  },
  "meccanica-precisione": {
    activities: ["Tornitura", "Fresatura", "Rettifica", "Controllo Qualita", "Assemblaggio"],
    components: ["Metalli", "Utensili", "Lubrificanti", "Componenti", "Guarnizioni"],
  },
  "impiantistica": {
    activities: ["Cablaggio", "Installazione", "Collaudo", "Manutenzione", "Riparazione"],
    components: ["Cavi", "Quadri", "Tubazioni", "Raccordi", "Componentistica"],
  },
  "falegnameria": {
    activities: ["Taglio Legno", "Piallatura", "Assemblaggio", "Verniciatura", "Restauro"],
    components: ["Legno", "Colle", "Vernici", "Ferramenta", "Pannelli"],
  },
  "serramenti": {
    activities: ["Installazione", "Posa", "Regolazione", "Sostituzione Vetri", "Manutenzione"],
    components: ["Profili Alluminio", "Vetri", "Guarnizioni", "Maniglie", "Accessori"],
  },
  "manutenzione-verde": {
    activities: ["Taglio Erba", "Potatura", "Piantumazione", "Irrigazione", "Pulizia"],
    components: ["Piante", "Terriccio", "Fertilizzanti", "Semi", "Attrezzi"],
  },
  "lattoneria": {
    activities: ["Taglio Lamiera", "Piegatura", "Saldatura", "Installazione", "Riparazione"],
    components: ["Lamiere", "Grondaie", "Pluviali", "Rivetti", "Sigillanti"],
  },
  "automazione": {
    activities: ["Programmazione PLC", "Cablaggio", "Installazione", "Taratura", "Debugging"],
    components: ["PLC", "Sensori", "Attuatori", "Cavi", "HMI"],
  },
  "altro": {
    activities: [],
    components: [],
  },
};
