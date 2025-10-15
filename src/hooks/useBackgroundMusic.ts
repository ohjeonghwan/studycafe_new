'use client';

import { useEffect, useRef, useState } from 'react';

interface UseBackgroundMusicOptions {
  src: string;
  volume?: number;
  loop?: boolean;
  autoPlay?: boolean;
}

export function useBackgroundMusic({
  src,
  volume = 0.3,
  loop = true,
  autoPlay = false,
}: UseBackgroundMusicOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 이전 오디오 정리
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsLoaded(false);
    setIsPlaying(false);

    audioRef.current = new Audio(src);
    audioRef.current.loop = loop;
    audioRef.current.volume = volume;

    const handleCanPlay = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      console.warn('음악 파일을 로드할 수 없습니다:', src);
      setIsLoaded(false);
    };

    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('error', handleError);

    if (autoPlay) {
      audioRef.current.play().catch((error) => {
        console.warn('자동 재생이 차단되었습니다:', error);
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current = null;
      }
    };
  }, [src, loop, volume, autoPlay]);

  const play = () => {
    if (audioRef.current && isLoaded) {
      audioRef.current.play().catch((error) => {
        console.error('음악 재생 실패:', error);
      });
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const setVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  return {
    isPlaying,
    isLoaded,
    play,
    pause,
    toggle,
    setVolume,
  };
}

