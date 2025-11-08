// Seven Purifications Path to Nibbana
// Satta Visuddhiyo (සත්ත විශුද්ධිය)

export interface PathStage {
  order: number;
  name: string;           // Sinhala name
  nameEn: string;         // English name
  description: string;    // Brief description
  color: string;          // Tailwind color for UI
}

export const PATH_STAGES: PathStage[] = [
  {
    order: 1,
    name: 'ශීල විශුද්ධිය',
    nameEn: 'Sila Visuddhi',
    description: 'Purification of Virtue - Establishing moral conduct and ethical discipline',
    color: 'violet'
  },
  {
    order: 2,
    name: 'චිත්ත විශුද්ධිය',
    nameEn: 'Citta Visuddhi',
    description: 'Purification of Mind - Developing concentration and mental stability',
    color: 'blue'
  },
  {
    order: 3,
    name: 'දෘෂ්ටි විශුද්ධිය',
    nameEn: 'Ditthi Visuddhi',
    description: 'Purification of View - Understanding the true nature of mind and matter',
    color: 'indigo'
  },
  {
    order: 4,
    name: 'කාංක්ෂා විතරණ විශුද්ධිය',
    nameEn: 'Kankhavitarana Visuddhi',
    description: 'Purification by Overcoming Doubt - Understanding cause and effect',
    color: 'purple'
  },
  {
    order: 5,
    name: 'මාර්ගාමාර්ග ඥාන දර්ශන විශුද්ධිය',
    nameEn: 'Maggamagga Nanadassana Visuddhi',
    description: 'Purification by Knowledge of Path and Not-Path - Distinguishing right from wrong path',
    color: 'fuchsia'
  },
  {
    order: 6,
    name: 'ප්‍රතිපදා ඥාන දර්ශන විශුද්ධිය',
    nameEn: 'Patipada Nanadassana Visuddhi',
    description: 'Purification by Knowledge of the Way - Developing insight into the stages of practice',
    color: 'pink'
  },
  {
    order: 7,
    name: 'ඥාන දර්ශන විශුද්ධිය',
    nameEn: 'Nanadassana Visuddhi',
    description: 'Purification by Knowledge and Vision - Attaining higher insights and wisdom',
    color: 'rose'
  },
  {
    order: 8,
    name: 'නිවන',
    nameEn: 'Nibbana',
    description: 'The ultimate goal - Liberation from all suffering',
    color: 'amber'
  }
];

// Helper function to get stage by order
export function getStageByOrder(order: number): PathStage | undefined {
  return PATH_STAGES.find(stage => stage.order === order);
}

// Helper function to get next stage
export function getNextStage(currentOrder: number): PathStage | null {
  if (currentOrder >= 8) return null;
  return PATH_STAGES.find(stage => stage.order === currentOrder + 1) || null;
}

// Helper function to get previous stage
export function getPreviousStage(currentOrder: number): PathStage | null {
  if (currentOrder <= 1) return null;
  return PATH_STAGES.find(stage => stage.order === currentOrder - 1) || null;
}

// Calculate progress percentage
export function calculateProgress(currentStage: number): number {
  return Math.round((currentStage / 8) * 100);
}
