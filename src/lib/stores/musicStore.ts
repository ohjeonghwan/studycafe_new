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
  isPlaying: boolean;
  setMusicFile: (file: MusicFile | null) => void;
  clearMusicFile: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

export const useMusicStore = create<MusicStore>()(
  persist(
    (set) => ({
      musicFile: null,
      isPlaying: false,
      setMusicFile: (file) => set({ musicFile: file }),
      clearMusicFile: () => set({ musicFile: null }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
    }),
    {
      name: 'background-music-storage',
      partialize: (state) => ({ musicFile: state.musicFile, isPlaying: state.isPlaying }),
    }
  )
);


