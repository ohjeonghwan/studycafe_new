'use client';

import { useState } from 'react';
import { Reservation } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CancelReservationDialogProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export default function CancelReservationDialog({ 
  reservation, 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false 
}: CancelReservationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('예약 취소 실패:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            예약 취소 확인
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800 font-medium mb-2">
              정말로 이 예약을 취소하시겠습니까?
            </p>
            <p className="text-red-700 text-sm">
              취소된 예약은 복구할 수 없습니다.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">좌석 번호</span>
              <span className="text-lg font-bold text-blue-600">{reservation.seatNumber}번</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">이용자</span>
              <span className="text-gray-900">{reservation.userName}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">날짜</span>
              <span className="text-gray-900">
                {format(new Date(reservation.date), 'PPP', { locale: ko })}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">시간</span>
              <span className="text-gray-900">{reservation.timeSlot.label}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">이용시간</span>
              <span className="text-gray-900">{reservation.duration}시간</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex items-center gap-2"
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                취소 중...
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                예약 취소
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

