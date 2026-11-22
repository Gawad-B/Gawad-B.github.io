export interface Shot {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export const PORTRAIT: Shot & { cutout: boolean; ready: boolean } = {
  src: '/assets/pro/portrait.webp',
  width: 900,
  height: 783,
  alt: 'Portrait of Abdelrahman Gawad',
  cutout: true,
  ready: true,
};

export const PROJECT_SHOTS: Record<'quizzy' | 'dacode' | 'labora' | 'cardioscreen', Shot> = {
  quizzy: {
    src: '/assets/pro/quizzy.webp',
    width: 1600,
    height: 1000,
    alt: "Quizzy's landing page: a dark page headed \"Practice for the EST and SAT with questions a person has approved\", with a Start practicing button and a mock-up of a quiz question, a streak counter and a classroom join code.",
  },
  dacode: {
    src: '/assets/pro/dacode.webp',
    width: 1600,
    height: 1000,
    alt: "DaCode's landing page: a black page headed \"A code editor that never stalls on your keystroke\", with a Download for Linux button and a screenshot of the editor showing Rust source code.",
  },
  labora: {
    src: '/assets/pro/labora.webp',
    width: 1600,
    height: 1000,
    alt: "Labora's landing page: a white page headed \"Your lab's data, on your lab's machine.\", with an Arrange a demonstration button and an illustrated result-entry table of haemoglobin, potassium, creatinine and LDL values.",
  },
  cardioscreen: {
    src: '/assets/pro/cardioscreen.webp',
    width: 1600,
    height: 1000,
    alt: "CardioScreen's landing page: a light page headed \"Earlier signals. A steadier heart.\", with a clinician photo, example risk score and blood pressure cards, and stats for 0.861 ROC AUC.",
  },
};

export const UNIVERSE_THUMB: Shot = {
  src: '/assets/pro/universe-thumb.webp',
  width: 960,
  height: 600,
  alt: 'Star-system map of the 3D portfolio: a red star at the centre with orbit rings and labelled planets for Quizzy, Labora, Prayer Times, RDMID, ATTG, CVD Prediction, Skills, About and Contact.',
};
