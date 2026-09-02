// Couple Date Passport & Collectible Stamp Types

export type StampCategory = 'Photobooth' | 'Games & Duels' | 'Keepsakes' | 'Milestones';
export type StampSealShape = 'circle' | 'square' | 'octagon' | 'crest' | 'heart';

export interface PassportStamp {
  id: string;
  title: string;
  koreanTitle: string;
  category: StampCategory;
  icon: string;
  color: string;
  inkColor: string;
  pastelBg: string;
  sealShape: StampSealShape;
  description: string;
  sweetQuote: string;
  defaultMemory: string;
  stampAngle: number;
  route: string;
  defaultUnlocked?: boolean;
}

export interface CoupleTicketProfile {
  partner1: string;
  partner2: string;
  originCity: string;
  destinationCity: string;
  anniversaryDate: string;
  seatNumber: string;
}

export interface StampConfettiParticle {
  id: number;
  x: number;
  y: number;
  char: string;
  scale: number;
  rot: number;
}
