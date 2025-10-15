'use client';

import { useEffect, useState, useRef } from 'react';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useMusicStore } from '@/lib/stores/musicStore';
import { create } from 'zustand';

// 음악 재생 상태를 전역으로 공유하기 위한 store
interface MusicPlaybackStore {
  isPlaying: boolean;
  isLoaded: boolean;
  toggle: () => void;
  setPlaybackState: (isPlaying: boolean, isLoaded: boolean, toggle: () => void) => void;
}

export const useMusicPlaybackStore = create<MusicPlaybackStore>((set) => ({
  isPlaying: false,
  isLoaded: false,
  toggle: () => {},
  setPlaybackState: (isPlaying, isLoaded, toggle) => set({ isPlaying, isLoaded, toggle }),
}));

export function BackgroundMusicPlayer() {
  const { setIsPlaying, setMusicFile } = useMusicStore();
  const { setPlaybackState } = useMusicPlaybackStore();
  const playAttemptedRef = useRef(false);

  // 기본 음악을 바로 설정
  const defaultMusic = {
    name: 'backm_L.mp3',
    url: '/music/backm_L.mp3',
    type: 'audio/mpeg'
  };

  const { isPlaying, isLoaded, toggle, play } = useBackgroundMusic({
    src: defaultMusic.url,
    volume: 0.2,
    loop: true,
    autoPlay: false,
  });

  // 재생 상태를 전역 store에 공유
  useEffect(() => {
    setPlaybackState(isPlaying, isLoaded, toggle);
  }, [isPlaying, isLoaded, toggle, setPlaybackState]);

  // 재생 상태 저장
  useEffect(() => {
    setIsPlaying(isPlaying);
  }, [isPlaying, setIsPlaying]);

  // 마운트 시 기본 음악 설정 (한 번만)
  useEffect(() => {
    setMusicFile(defaultMusic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 사용자 상호작용 시 음악 재생
  useEffect(() => {
    const handleUserInteraction = async () => {
      console.log('사용자 상호작용 감지, 음악 재생 시도...', { isLoaded, playAttempted: playAttemptedRef.current });
      
      if (isLoaded && !playAttemptedRef.current) {
        playAttemptedRef.current = true;
        
        try {
          await play();
          console.log('음악 재생 성공!');
          
          // 재생 성공 후 이벤트 리스너 제거
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('touchstart', handleUserInteraction);
          document.removeEventListener('keydown', handleUserInteraction);
        } catch (error) {
          console.error('음악 재생 실패:', error);
          playAttemptedRef.current = false; // 실패 시 다시 시도 가능하도록
        }
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isLoaded, play]);

  return null;
}

