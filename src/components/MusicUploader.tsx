'use client';

import { useRef, useState } from 'react';
import { useMusicStore } from '@/lib/stores/musicStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MusicUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { musicFile, setMusicFile, clearMusicFile } = useMusicStore();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // 오디오 파일만 허용
    if (!file.type.startsWith('audio/')) {
      toast({
        title: '오류',
        description: '오디오 파일만 업로드할 수 있습니다.',
        variant: 'destructive',
      });
      return;
    }

    // 파일 크기 제한 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: '오류',
        description: '파일 크기는 50MB를 초과할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    // 이전 URL 해제
    if (musicFile?.url) {
      URL.revokeObjectURL(musicFile.url);
    }

    // 새 URL 생성
    const url = URL.createObjectURL(file);
    setMusicFile({
      name: file.name,
      url,
      type: file.type,
    });

    toast({
      title: '업로드 완료',
      description: `${file.name}이(가) 업로드되었습니다.`,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileChange(file || null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    handleFileChange(file || null);
  };

  const handleClear = () => {
    if (musicFile?.url) {
      URL.revokeObjectURL(musicFile.url);
    }
    clearMusicFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: '삭제 완료',
      description: '배경 음악이 삭제되었습니다.',
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2">
        <Label htmlFor="music-upload" className="text-sm font-medium">
          배경 음악 업로드
        </Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Input
            ref={fileInputRef}
            id="music-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleInputChange}
          />

          {musicFile ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Music className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {musicFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {musicFile.type}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClear}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  여기에 파일을 드래그하거나
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  파일 선택
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                MP3, WAV, OGG 등 (최대 50MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


