import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Playlist,
  PlaylistItem,
  Song,
  Theme,
  PresentationState,
  AppSettings,
  Venue,
} from '../types';

interface PresentationStore {
  // Data
  playlists: Playlist[];
  songs: Song[];
  themes: Theme[];
  venues: Venue[];
  settings: AppSettings;

  // Runtime state
  presentation: PresentationState;
  currentPlaylist: Playlist | null;
  currentItem: PlaylistItem | null;

  // Actions
  setPlaylists: (playlists: Playlist[]) => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  setSongs: (songs: Song[]) => void;
  addSong: (song: Song) => void;
  updateSong: (id: string, updates: Partial<Song>) => void;
  setThemes: (themes: Theme[]) => void;
  setSettings: (settings: Partial<AppSettings>) => void;

  // Presentation control
  loadPlaylist: (id: string) => void;
  goToItem: (index: number) => void;
  nextItem: () => void;
  prevItem: () => void;
  nextSlide: () => void;
  prevSlide: () => void;
  setBlack: (value: boolean) => void;
  setClear: (value: boolean) => void;
  setOnline: (value: boolean) => void;
}

const defaultTheme: Theme = {
  id: 'default',
  name: 'Default Dark',
  isDefault: true,
  backgroundColor: '#0a0a0a',
  textColor: '#ffffff',
  secondaryTextColor: '#cccccc',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSizeBase: 48,
  textBoxEnabled: true,
  textBoxColor: '#000000',
  textBoxOpacity: 0.55,
  textBoxPadding: 24,
  textBoxBorderRadius: 12,
  lyricsPosition: 'center',
  scriptureLayout: 'stacked',
  maxLinesPerSlide: 4,
  transitionMs: 300,
};

const defaultSettings: AppSettings = {
  defaultThemeId: 'default',
  preferredBibleTranslations: ['NIV', 'ESV', 'CUV', 'NLT', 'KJV'],
  cacheMode: 'day',
  offlineWarningEnabled: true,
  youtubeQuality: '1080p',
  keyboardShortcuts: {
    next: 'Space',
    prev: 'ArrowLeft',
    black: 'KeyB',
    clear: 'KeyC',
  },
};

export const usePresentationStore = create<PresentationStore>()(
  persist(
    (set, get) => ({
      playlists: [],
      songs: [],
      themes: [defaultTheme],
      venues: [],
      settings: defaultSettings,

      presentation: {
        currentPlaylistId: null,
        currentItemIndex: 0,
        currentSlideIndex: 0,
        isBlack: false,
        isClear: false,
        isOnline: true,
        stageVisible: false,
        mainVisible: false,
      },
      currentPlaylist: null,
      currentItem: null,

      setPlaylists: (playlists) => set({ playlists }),
      addPlaylist: (playlist) =>
        set((state) => ({ playlists: [...state.playlists, playlist] })),
      updatePlaylist: (id, updates) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),
      setSongs: (songs) => set({ songs }),
      addSong: (song) => set((state) => ({ songs: [...state.songs, song] })),
      updateSong: (id, updates) =>
        set((state) => ({
          songs: state.songs.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      setThemes: (themes) => set({ themes }),
      setSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      loadPlaylist: (id) => {
        const playlist = get().playlists.find((p) => p.id === id) || null;
        set({
          currentPlaylist: playlist,
          presentation: {
            ...get().presentation,
            currentPlaylistId: id,
            currentItemIndex: 0,
            currentSlideIndex: 0,
            isBlack: false,
            isClear: false,
          },
          currentItem: playlist?.items[0] || null,
        });
      },

      goToItem: (index) => {
        const playlist = get().currentPlaylist;
        if (!playlist || index < 0 || index >= playlist.items.length) return;
        set({
          presentation: {
            ...get().presentation,
            currentItemIndex: index,
            currentSlideIndex: 0,
            isBlack: false,
            isClear: false,
          },
          currentItem: playlist.items[index],
        });
      },

      nextItem: () => {
        const { presentation, currentPlaylist } = get();
        if (!currentPlaylist) return;
        const next = Math.min(
          presentation.currentItemIndex + 1,
          currentPlaylist.items.length - 1
        );
        get().goToItem(next);
      },

      prevItem: () => {
        const { presentation } = get();
        get().goToItem(Math.max(presentation.currentItemIndex - 1, 0));
      },

      nextSlide: () => {
        // Placeholder – real logic depends on item type (song lines / scripture verses)
        set((state) => ({
          presentation: {
            ...state.presentation,
            currentSlideIndex: state.presentation.currentSlideIndex + 1,
          },
        }));
      },

      prevSlide: () => {
        set((state) => ({
          presentation: {
            ...state.presentation,
            currentSlideIndex: Math.max(0, state.presentation.currentSlideIndex - 1),
          },
        }));
      },

      setBlack: (value) =>
        set((state) => ({
          presentation: { ...state.presentation, isBlack: value },
        })),

      setClear: (value) =>
        set((state) => ({
          presentation: { ...state.presentation, isClear: value },
        })),

      setOnline: (value) =>
        set((state) => ({
          presentation: { ...state.presentation, isOnline: value },
        })),
    }),
    {
      name: 'church-presenter-storage',
      partialize: (state) => ({
        playlists: state.playlists,
        songs: state.songs,
        themes: state.themes,
        venues: state.venues,
        settings: state.settings,
      }),
    }
  )
);
