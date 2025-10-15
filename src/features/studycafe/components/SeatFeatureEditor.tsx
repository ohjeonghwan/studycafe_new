'use client';

import { useState, useEffect } from 'react';
import { Seat } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plug, Square, VolumeX, Users, Save, X } from 'lucide-react';

interface SeatFeatureEditorProps {
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (seatId: number, features: Partial<Seat>) => void;
}

export default function SeatFeatureEditor({ seat, isOpen, onClose, onSave }: SeatFeatureEditorProps) {
  const [features, setFeatures] = useState<Partial<Seat>>({
    hasOutlet: false,
    isWindow: false,
    isQuiet: false,
    isGroup: false,
  });

  // 좌석이 변경될 때마다 특징 초기화
  useEffect(() => {
    if (seat) {
      setFeatures({
        hasOutlet: seat.hasOutlet || false,
        isWindow: seat.isWindow || false,
        isQuiet: seat.isQuiet || false,
        isGroup: seat.isGroup || false,
      });
    }
  }, [seat]);

  const handleFeatureChange = (feature: keyof Seat, checked: boolean) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: checked,
    }));
  };

  const handleSave = () => {
    if (seat) {
      onSave(seat.id, features);
      onClose();
    }
  };

  const handleClose = () => {
    setFeatures({
      hasOutlet: false,
      isWindow: false,
      isQuiet: false,
      isGroup: false,
    });
    onClose();
  };

  if (!seat) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            좌석 {seat.number}번 특징 편집
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">좌석 정보</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div>좌석 번호: <span className="font-semibold">{seat.number}</span></div>
              <div>구역: <span className="font-semibold">{seat.type}</span></div>
              <div>상태: <span className="font-semibold">{seat.status}</span></div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">좌석 특징 설정</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="hasOutlet"
                  checked={features.hasOutlet}
                  onCheckedChange={(checked) => handleFeatureChange('hasOutlet', checked as boolean)}
                />
                <Label htmlFor="hasOutlet" className="flex items-center gap-2 cursor-pointer">
                  <Plug className="w-4 h-4 text-blue-500" />
                  콘센트 보유
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isWindow"
                  checked={features.isWindow}
                  onCheckedChange={(checked) => handleFeatureChange('isWindow', checked as boolean)}
                />
                <Label htmlFor="isWindow" className="flex items-center gap-2 cursor-pointer">
                  <Square className="w-4 h-4 text-cyan-500" />
                  창가 좌석
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isQuiet"
                  checked={features.isQuiet}
                  onCheckedChange={(checked) => handleFeatureChange('isQuiet', checked as boolean)}
                />
                <Label htmlFor="isQuiet" className="flex items-center gap-2 cursor-pointer">
                  <VolumeX className="w-4 h-4 text-purple-500" />
                  조용한 구역
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isGroup"
                  checked={features.isGroup}
                  onCheckedChange={(checked) => handleFeatureChange('isGroup', checked as boolean)}
                />
                <Label htmlFor="isGroup" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4 text-indigo-500" />
                  그룹 스터디
                </Label>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">미리보기</h5>
            <div className="flex flex-wrap gap-2">
              {features.hasOutlet && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  <Plug className="w-3 h-3" />
                  콘센트
                </span>
              )}
              {features.isWindow && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-cyan-100 text-cyan-800 rounded">
                  <Square className="w-3 h-3" />
                  창가
                </span>
              )}
              {features.isQuiet && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                  <VolumeX className="w-3 h-3" />
                  조용한 구역
                </span>
              )}
              {features.isGroup && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                  <Users className="w-3 h-3" />
                  그룹 스터디
                </span>
              )}
              {!features.hasOutlet && !features.isWindow && !features.isQuiet && !features.isGroup && (
                <span className="text-gray-500 text-sm">특징 없음</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
