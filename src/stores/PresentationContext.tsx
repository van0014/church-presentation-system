import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import type {
  Playlist,
  PlaylistItem,
  Song,
  Theme,
  PresentationState,
  AppSettings,
  Venue,
  Scripture,
} from '../types';

// ---------- Default data ----------

const defaultTheme: Theme = {
  id: 'default',
  name: 'Default Dark',
  isDefault: true,
  backgroundColor: '#0a0a0a',
  textColor: '#ffffff',
  secondaryTextColor: '#cccccc',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSizeBase: 48,
  letterSpacing: 0,
  wordSpacing: 0,
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

// Sample songs for demo – using section / slide structure
// (blank line = new slide, [Section] = group in thumbnail view)
const sampleSongs: Song[] = [
  {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    sections: [
      {
        id: 'sec-v1',
        label: 'Verse 1',
        slides: [
          {
            id: 'sl-1',
            lines: [
              { id: 'l1', text: 'Amazing grace, how sweet the sound' },
              { id: 'l2', text: 'That saved a wretch like me' },
            ],
          },
          {
            id: 'sl-2',
            lines: [
              { id: 'l3', text: 'I once was lost, but now am found' },
              { id: 'l4', text: 'Was blind, but now I see' },
            ],
          },
        ],
      },
      {
        id: 'sec-v2',
        label: 'Verse 2',
        slides: [
          {
            id: 'sl-3',
            lines: [
              { id: 'l5', text: 'Twas grace that taught my heart to fear' },
              { id: 'l6', text: 'And grace my fears relieved' },
            ],
          },
          {
            id: 'sl-4',
            lines: [
              { id: 'l7', text: 'How precious did that grace appear' },
              { id: 'l8', text: 'The hour I first believed' },
            ],
          },
        ],
      },
    ],
    translations: [
      {
        language: 'zh',
        languageName: 'Mandarin',
        displayMode: 'block',
        sections: [
          {
            id: 'zsec-1',
            label: 'Verse 1',
            slides: [
              {
                id: 'zsl-1',
                lines: [
                  { id: 'z1', text: '奇异恩典，何等甘甜' },
                  { id: 'z2', text: '我罪已得赦免' },
                ],
              },
              {
                id: 'zsl-2',
                lines: [
                  { id: 'z3', text: '前我失丧，今被寻回' },
                  { id: 'z4', text: '瞎眼今得看见' },
                ],
              },
            ],
          },
        ],
      },
    ],
    lineBreaksReviewed: true,
    rawSource: `[Verse 1]
Amazing grace, how sweet the sound
That saved a wretch like me

I once was lost, but now am found
Was blind, but now I see

[Verse 2]
Twas grace that taught my heart to fear
And grace my fears relieved

How precious did that grace appear
The hour I first believed`,
  },
  {
    id: 'song-2',
    title: 'How Great Thou Art',
    artist: 'Carl Boberg',
    sections: [
      {
        id: 'sec-v1b',
        label: 'Verse 1',
        slides: [
          {
            id: 'sl-a',
            lines: [
              { id: 'l1', text: 'O Lord my God, when I in awesome wonder' },
              { id: 'l2', text: 'Consider all the works Thy hands have made' },
            ],
          },
          {
            id: 'sl-b',
            lines: [
              { id: 'l3', text: 'I see the stars, I hear the rolling thunder' },
              { id: 'l4', text: 'Thy power throughout the universe displayed' },
            ],
          },
        ],
      },
      {
        id: 'sec-ch',
        label: 'Chorus',
        slides: [
          {
            id: 'sl-c',
            lines: [
              { id: 'l5', text: 'Then sings my soul, my Saviour God, to Thee' },
              { id: 'l6', text: 'How great Thou art, how great Thou art' },
            ],
          },
        ],
      },
    ],
    translations: [],
    lineBreaksReviewed: false,
    rawSource: `[Verse 1]
O Lord my God, when I in awesome wonder
Consider all the works Thy hands have made

I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed

[Chorus]
Then sings my soul, my Saviour God, to Thee
How great Thou art, how great Thou art`,
  },
];

const samplePlaylist: Playlist = {
  id: 'pl-demo',
  name: 'Sunday Service – Demo',
  date: new Date().toISOString().slice(0, 10),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      type: 'image',
      title: 'Welcome / QR Translation',
      order: 0,
      source: '',
      cues: { startCaptions: true },
    },
    {
      id: 'item-2',
      type: 'song',
      title: 'Amazing Grace',
      songId: 'song-1',
      order: 1,
    },
    {
      id: 'item-3',
      type: 'scripture',
      title: 'John 3:16-17',
      order: 2,
      scripture: {
        id: 'scr-1',
        reference: 'John 3:16-17',
        translation: 'NIV',
        verses: [
          {
            number: 16,
            text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
          },
          {
            number: 17,
            text: 'For God did not send his Son into the world to condemn the world, but to save the world through him.',
          },
        ],
        secondaryTranslation: {
          code: 'CUV',
          verses: [
            {
              number: 16,
              text: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
            },
            {
              number: 17,
              text: '因为神差他的儿子降世，不是要定世人的罪，乃是要叫世人因他得救。',
            },
          ],
        },
      },
    },
    {
      id: 'item-4',
      type: 'song',
      title: 'How Great Thou Art',
      songId: 'song-2',
      order: 3,
    },
    {
      id: 'item-5',
      type: 'empty',
      title: 'Blank / Announcements',
      order: 4,
    },
  ],
};

// ---------- State shape ----------

interface AppState {
  playlists: Playlist[];
  songs: Song[];
  themes: Theme[];
  venues: Venue[];
  settings: AppSettings;
  presentation: PresentationState;
  currentPlaylist: Playlist | null;
  currentItem: PlaylistItem | null;
}

type Action =
  | { type: 'LOAD_PLAYLIST'; playlistId: string }
  | { type: 'GO_TO_ITEM'; index: number }
  | { type: 'NEXT_ITEM' }
  | { type: 'PREV_ITEM' }
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREV_SLIDE' }
  | { type: 'GO_TO_SLIDE'; index: number }
  | { type: 'SET_BLACK'; value: boolean }
  | { type: 'SET_CLEAR'; value: boolean }
  | { type: 'SET_ONLINE'; value: boolean }
  | { type: 'ADD_SONG'; song: Song }
  | { type: 'UPDATE_SONG'; id: string; updates: Partial<Song> }
  | { type: 'ADD_PLAYLIST'; playlist: Playlist }
  | { type: 'UPDATE_PLAYLIST'; id: string; updates: Partial<Playlist> }
  | { type: 'SET_SETTINGS'; updates: Partial<AppSettings> }
  | { type: 'UPDATE_THEME'; id: string; updates: Partial<Theme> }
  | { type: 'HYDRATE'; state: Partial<AppState> };

const initialState: AppState = {
  playlists: [samplePlaylist],
  songs: sampleSongs,
  themes: [defaultTheme],
  venues: [],
  settings: defaultSettings,
  presentation: {
    currentPlaylistId: 'pl-demo',
    currentItemIndex: 0,
    currentSlideIndex: 0,
    isBlack: false,
    isClear: false,
    isOnline: true,
    stageVisible: false,
    mainVisible: false,
  },
  currentPlaylist: samplePlaylist,
  currentItem: samplePlaylist.items[0],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_PLAYLIST': {
      const playlist = state.playlists.find((p) => p.id === action.playlistId) || null;
      return {
        ...state,
        currentPlaylist: playlist,
        currentItem: playlist?.items[0] || null,
        presentation: {
          ...state.presentation,
          currentPlaylistId: action.playlistId,
          currentItemIndex: 0,
          currentSlideIndex: 0,
          isBlack: false,
          isClear: false,
        },
      };
    }
    case 'GO_TO_ITEM': {
      const playlist = state.currentPlaylist;
      if (!playlist || action.index < 0 || action.index >= playlist.items.length) {
        return state;
      }
      return {
        ...state,
        currentItem: playlist.items[action.index],
        presentation: {
          ...state.presentation,
          currentItemIndex: action.index,
          currentSlideIndex: 0,
          isBlack: false,
          isClear: false,
        },
      };
    }
    case 'NEXT_ITEM': {
      if (!state.currentPlaylist) return state;
      const next = Math.min(
        state.presentation.currentItemIndex + 1,
        state.currentPlaylist.items.length - 1
      );
      return reducer(state, { type: 'GO_TO_ITEM', index: next });
    }
    case 'PREV_ITEM': {
      const prev = Math.max(state.presentation.currentItemIndex - 1, 0);
      return reducer(state, { type: 'GO_TO_ITEM', index: prev });
    }
    case 'NEXT_SLIDE':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          currentSlideIndex: state.presentation.currentSlideIndex + 1,
        },
      };
    case 'PREV_SLIDE':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          currentSlideIndex: Math.max(0, state.presentation.currentSlideIndex - 1),
        },
      };
    case 'GO_TO_SLIDE':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          currentSlideIndex: Math.max(0, action.index),
          isBlack: false,
          isClear: false,
        },
      };
    case 'SET_BLACK':
      return {
        ...state,
        presentation: { ...state.presentation, isBlack: action.value },
      };
    case 'SET_CLEAR':
      return {
        ...state,
        presentation: { ...state.presentation, isClear: action.value },
      };
    case 'SET_ONLINE':
      return {
        ...state,
        presentation: { ...state.presentation, isOnline: action.value },
      };
    case 'ADD_SONG':
      return { ...state, songs: [...state.songs, action.song] };
    case 'UPDATE_SONG':
      return {
        ...state,
        songs: state.songs.map((s) =>
          s.id === action.id ? { ...s, ...action.updates } : s
        ),
      };
    case 'ADD_PLAYLIST':
      return { ...state, playlists: [...state.playlists, action.playlist] };
    case 'UPDATE_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.map((p) =>
          p.id === action.id
            ? { ...p, ...action.updates, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.updates } };
    case 'UPDATE_THEME':
      return {
        ...state,
        themes: state.themes.map((t) =>
          t.id === action.id ? { ...t, ...action.updates } : t
        ),
      };
    case 'HYDRATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

// ---------- Context ----------

interface PresentationContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Convenience helpers
  loadPlaylist: (id: string) => void;
  goToItem: (index: number) => void;
  nextItem: () => void;
  prevItem: () => void;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  setBlack: (v: boolean) => void;
  setClear: (v: boolean) => void;
  getCurrentSong: () => Song | null;
  getCurrentTheme: () => Theme;
  updateTheme: (id: string, updates: Partial<Theme>) => void;
}

const PresentationContext = createContext<PresentationContextValue | null>(null);

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist to localStorage
  useEffect(() => {
    const toSave = {
      playlists: state.playlists,
      songs: state.songs,
      themes: state.themes,
      venues: state.venues,
      settings: state.settings,
    };
    localStorage.setItem('church-presenter', JSON.stringify(toSave));
  }, [state.playlists, state.songs, state.themes, state.venues, state.settings]);

  // Hydrate on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('church-presenter');
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({ type: 'HYDRATE', state: parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => dispatch({ type: 'SET_ONLINE', value: true });
    const goOffline = () => dispatch({ type: 'SET_ONLINE', value: false });
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    dispatch({ type: 'SET_ONLINE', value: navigator.onLine });
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Live sync between operator console and Main/Stage windows
  useEffect(() => {
    const channel = new BroadcastChannel('church-presenter-live');
    const payload = {
      presentation: state.presentation,
      currentPlaylistId: state.currentPlaylist?.id ?? null,
      currentItemIndex: state.presentation.currentItemIndex,
      themes: state.themes,
      settings: state.settings,
    };
    channel.postMessage({ type: 'LIVE', payload });
    try {
      sessionStorage.setItem('church-presenter-live', JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    return () => channel.close();
  }, [
    state.presentation,
    state.currentPlaylist?.id,
    state.themes,
    state.settings,
  ]);

  useEffect(() => {
    const channel = new BroadcastChannel('church-presenter-live');
    const apply = (payload: {
      presentation: AppState['presentation'];
      currentPlaylistId: string | null;
      currentItemIndex: number;
      themes?: Theme[];
      settings?: AppSettings;
    }) => {
      if (payload.themes || payload.settings) {
        dispatch({
          type: 'HYDRATE',
          state: {
            ...(payload.themes ? { themes: payload.themes } : {}),
            ...(payload.settings ? { settings: payload.settings } : {}),
          },
        });
      }
      if (payload.currentPlaylistId) {
        dispatch({ type: 'LOAD_PLAYLIST', playlistId: payload.currentPlaylistId });
      }
      dispatch({ type: 'GO_TO_ITEM', index: payload.currentItemIndex });
      dispatch({ type: 'GO_TO_SLIDE', index: payload.presentation.currentSlideIndex });
      dispatch({ type: 'SET_BLACK', value: payload.presentation.isBlack });
      dispatch({ type: 'SET_CLEAR', value: payload.presentation.isClear });
    };
    channel.onmessage = (ev) => {
      if (ev.data?.type === 'LIVE' && ev.data.payload) apply(ev.data.payload);
    };
    try {
      const raw = sessionStorage.getItem('church-presenter-live');
      if (raw) apply(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return () => channel.close();
  }, []);

  const value: PresentationContextValue = {
    state,
    dispatch,
    loadPlaylist: (id) => dispatch({ type: 'LOAD_PLAYLIST', playlistId: id }),
    goToItem: (index) => dispatch({ type: 'GO_TO_ITEM', index }),
    nextItem: () => dispatch({ type: 'NEXT_ITEM' }),
    prevItem: () => dispatch({ type: 'PREV_ITEM' }),
    nextSlide: () => dispatch({ type: 'NEXT_SLIDE' }),
    prevSlide: () => dispatch({ type: 'PREV_SLIDE' }),
    goToSlide: (index) => dispatch({ type: 'GO_TO_SLIDE', index }),
    setBlack: (v) => dispatch({ type: 'SET_BLACK', value: v }),
    setClear: (v) => dispatch({ type: 'SET_CLEAR', value: v }),
    getCurrentSong: () => {
      const item = state.currentItem;
      if (!item || item.type !== 'song' || !item.songId) return null;
      return state.songs.find((s) => s.id === item.songId) || null;
    },
    getCurrentTheme: () => {
      return (
        state.themes.find((t) => t.id === state.settings.defaultThemeId) ||
        defaultTheme
      );
    },
    updateTheme: (id, updates) =>
      dispatch({ type: 'UPDATE_THEME', id, updates }),
  };

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error('usePresentation must be used within PresentationProvider');
  return ctx;
}
