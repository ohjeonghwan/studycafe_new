'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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

    // src가 빈 문자열이면 오디오를 생성하지 않음
    if (!src) {
      console.log('음악 파일이 없습니다. 음악을 업로드해주세요.');
      return;
    }

    audioRef.current = new Audio(src);
    audioRef.current.loop = loop;
    audioRef.current.volume = volume;

    const handleCanPlay = () => {
      console.log('음악 파일 로드 완료:', src);
      setIsLoaded(true);
    };

    const handleError = (e: Event) => {
      console.warn('음악 파일을 로드할 수 없습니다:', src, e);
      setIsLoaded(false);
    };

    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('error', handleError);

    if (autoPlay) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
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

  const play = useCallback(async () => {
    if (!audioRef.current) {
      console.warn('오디오 객체가 없습니다.');
      return;
    }
    
    if (!isLoaded) {
      console.warn('음악 파일이 아직 로드되지 않았습니다.');
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      console.log('음악 재생 시작!');
    } catch (error) {
      console.error('음악 재생 실패:', error);
      throw error;
    }
  }, [isLoaded]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, pause, play]);

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  return {
    isPlaying,
    isLoaded,
    play,
    pause,
    toggle,
    setVolume,
  };
}

