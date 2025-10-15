'use client';

import { useEffect, useState } from 'react';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useMusicStore } from '@/lib/stores/musicStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Volume2, VolumeX, Settings2 } from 'lucide-react';
import { MusicUploader } from './MusicUploader';

export function BackgroundMusicPlayer() {
  const { musicFile } = useMusicStore();
  const [musicSrc, setMusicSrc] = useState('/background-music.mp3');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (musicFile?.url) {
      setMusicSrc(musicFile.url);
    } else {
      setMusicSrc('/background-music.mp3');
    }
  }, [musicFile]);

  const { isPlaying, isLoaded, toggle } = useBackgroundMusic({
    src: musicSrc,
    volume: 0.2,
    loop: true,
    autoPlay: false,
  });

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background/90"
              aria-label="음악 설정"
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>배경 음악 설정</DialogTitle>
            </DialogHeader>
            <MusicUploader />
          </DialogContent>
        </Dialog>

        <Button
          onClick={toggle}
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background/90"
          disabled={!isLoaded}
          aria-label={isPlaying ? '음악 일시정지' : '음악 재생'}
        >
          {isPlaying ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>
      </div>
    </>
  );
}

