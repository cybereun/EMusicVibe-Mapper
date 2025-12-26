export type Step = 'destination' | 'view' | 'mood' | 'generating' | 'result';

export interface VibeOption {
  id: string;
  label: string;
  image?: string;
  keywords: string[];
}

export interface UserSelection {
  destination: VibeOption | null;
  view: VibeOption | null;
  mood: VibeOption | null;
  aspectRatio: string;
}

export interface GeneratedResult {
  titles: string[];
  thumbnailUrl: string;
  colors: string[];
  promptUsed: string;
}

export interface ColorPalette {
  colors: string[];
}

export interface PlaylistTitles {
  titles: string[];
}