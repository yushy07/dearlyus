// Audio Engine, Soundscape Studio & Sleep Timer Types

export type AmbientChannelId = 'warm' | 'romantic' | 'piano' | 'lofi';

export interface SoundPreset {
  name: string;
  subtitle: string;
  icon: string;
  bgUrl?: string;
  isBgMusic?: boolean;
  volumes: {
    warm: number;
    romantic: number;
    piano: number;
    lofi: number;
  };
}

export interface AudioChannelConfig {
  id: AmbientChannelId;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  volume: number;
  setVolume: (v: number) => void;
  start: (v?: number) => void;
  stop: () => void;
}

export type SleepTimerDuration = 15 | 30 | 45 | 60 | null;
