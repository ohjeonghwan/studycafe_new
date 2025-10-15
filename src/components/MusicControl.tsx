'use client';

import { useEffect, useState } from 'react';
import { useMusicStore } from '@/lib/stores/musicStore';
import { useMusicPlaybackStore } from './BackgroundMusicPlayer';
import { Button } from '@/components/ui/button';
import { Play, Pause, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MusicUploader } from './MusicUploader';

export function MusicControl() {
  const { musicFile } = useMusicStore();
  const { isPlaying, isLoaded, toggle } = useMusicPlaybackStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handlePlayClick = () => {
    if (!musicFile) {
      setDialogOpen(true);
    } else {
      toggle();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {musicFile && (
        <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
          <div className="flex flex-col">
            <span className="text-xs text-white/80 font-medium">배경음악</span>
            <span className="text-sm text-white font-semibold truncate max-w-[150px]">
              {musicFile.name}
            </span>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 hover:bg-white border-white/30 text-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Upload className="w-4 h-4 mr-2" />
            음악 업로드
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
        onClick={handlePlayClick}
        size="lg"
        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
      >
        {isPlaying ? (
          <>
            <Pause className="w-5 h-5 mr-2" />
            일시정지
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            음악 재생
          </>
        )}
      </Button>
    </div>
  );
}

