'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MusicFile {
  name: string;
  url: string;
  type: string;
}

interface MusicStore {
  musicFile: MusicFile | null;
  setMusicFile: (file: MusicFile | null) => void;
  clearMusicFile: () => void;
}

export const useMusicStore = create<MusicStore>()(
  persist(
    (set) => ({
      musicFile: null,
      setMusicFile: (file) => set({ musicFile: file }),
      clearMusicFile: () => set({ musicFile: null }),
    }),
    {
      name: 'background-music-storage',
      partialize: (state) => ({ musicFile: state.musicFile }),
    }
  )
);


