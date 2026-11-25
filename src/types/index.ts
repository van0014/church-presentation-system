// Core domain types for Church Presenter

export type MediaType = 'song' | 'scripture' | 'image' | 'video' | 'youtube' | 'slideshow' | 'empty';

/**
 * A single line of lyrics text.
 * Blank lines in the source text become slide breaks (they are not stored as SongLine).
 */
export interface SongLine {
  id: string;
  text: string;
}

/**
 * One slide = a group of consecutive non-blank lines.
 * In SongSelect-style .txt, slides are separated by a blank line.
 */
export interface SongSlide {
  id: string;
  lines: SongLine[];
}

/**
 * A named section / container (e.g. [Verse 1], [Chorus], [Intro]).
 * In the thumbnail / file-manager view each section is a distinct group.
 * Inside a section, blank lines create separate slides.
 */
export interface SongSection {
  id: string;
  /** Label as it appears in the file, e.g. "Verse 1", "Chorus", "Intro" */
  label: string;
  slides: SongSlide[];
}

export interface Translation {
  language: string;
  languageName: string;
  sections: SongSection[];
  displayMode: 'block' | 'interleaved';
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  ccli?: string;
  sections: SongSection[];
  translations: Translation[];
  lineBreaksReviewed: boolean;
  rawSource?: string;
  tags?: string[];
  lastUsed?: string;
  googleDriveFileId?: string;
}

export interface Scripture {
  id: string;
  reference: string;
  translation: string;
  verses: { number: number; text: string }[];
  secondaryTranslation?: {
    code: string;
    verses: { number: number; text: string }[];
  };
}

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  songId?: string;
  scripture?: Scripture;
  source?: string;
  thumbnail?: string;
  duration?: number;
  loop?: boolean;
  cues?: {
    streamDeckAction?: string;
    lightingScene?: string;
    startCaptions?: boolean;
  };
  notes?: string;
}

export interface PlaylistItem extends MediaItem {
  order: number;
  themeOverrideId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  date?: string;
  items: PlaylistItem[];
  isTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  name: string;
  isDefault?: boolean;
  backgroundColor: string;
  backgroundImage?: string;
  textColor: string;
  secondaryTextColor: string;
  fontFamily: string;
  fontSizeBase: number;
  letterSpacing?: number;
  wordSpacing?: number;
  textBoxEnabled: boolean;
  textBoxColor: string;
  textBoxOpacity: number;
  textBoxPadding: number;
  textBoxBorderRadius: number;
  lyricsPosition: 'center' | 'lower-third' | 'top' | 'bottom';
  scriptureLayout: 'centered' | 'side-by-side' | 'stacked';
  maxLinesPerSlide: number;
  transitionMs: number;
}

export interface Venue {
  id: string;
  name: string;
  defaultThemeId: string;
  mainScreenResolution?: string;
  stageScreenResolution?: string;
  streamDeckMappings?: Record<string, string>;
  notes?: string;
}

export interface AppSettings {
  currentVenueId?: string;
  defaultThemeId: string;
  preferredBibleTranslations: string[];
  cacheMode: 'full' | 'day' | 'selective';
  offlineWarningEnabled: boolean;
  youtubeQuality: '1080p' | '720p' | 'best';
  keyboardShortcuts: Record<string, string>;
}

export interface PresentationState {
  currentPlaylistId: string | null;
  currentItemIndex: number;
  currentSlideIndex: number;
  isBlack: boolean;
  isClear: boolean;
  isOnline: boolean;
  stageVisible: boolean;
  mainVisible: boolean;
}

export type WindowMessage =
  | { type: 'PRESENTATION_UPDATE'; payload: PresentationState & { item?: PlaylistItem; song?: Song; scripture?: Scripture } }
  | { type: 'THEME_UPDATE'; payload: Theme }
  | { type: 'BLACK' }
  | { type: 'CLEAR' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'GOTO'; index: number };
