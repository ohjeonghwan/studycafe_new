'use client';

import { useState } from 'react';
import { Reservation, ReservationFormData } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, User, X, List, AlertTriangle, Edit } from 'lucide-react';
import CancelReservationDialog from './CancelReservationDialog';
import EditReservationDialog from './EditReservationDialog';

interface ReservationListProps {
  reservations: Reservation[];
  onCancelReservation: (reservationId: string) => Promise<void>;
  onUpdateReservation: (reservationId: string, formData: ReservationFormData) => Promise<void>;
  loading?: boolean;
}

export default function ReservationList({ 
  reservations, 
  onCancelReservation, 
  onUpdateReservation, 
  loading = false 
}: ReservationListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 활성 예약만 필터링
  const activeReservations = reservations.filter(reservation => reservation.status === 'active');

  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  const handleEditClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReservation) return;
    
    setCancellingId(selectedReservation.id);
    try {
      await onCancelReservation(selectedReservation.id);
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('예약 취소 실패:', error);
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmEdit = async (reservationId: string, formData: ReservationFormData) => {
    try {
      await onUpdateReservation(reservationId, formData);
      setEditDialogOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('예약 수정 실패:', error);
      throw error;
    }
  };

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">활성</Badge>;
      case 'completed':
        return <Badge variant="secondary">완료</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 종료 시간 계산 함수
  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    const endMinutes = minutes;
    
    // 24시간을 넘어가는 경우 처리
    if (endHours >= 24) {
      return `${String(endHours % 24).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')} (다음날)`;
    }
    
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white/90 hover:bg-white border-white/30 text-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all">
          <List className="w-4 h-4" />
          이용 목록 ({activeReservations.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 -m-6 mb-6 p-6 rounded-t-xl">
          <DialogTitle className="flex items-center gap-2 text-white text-xl">
            <Calendar className="w-6 h-6" />
            내 이용 목록
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent shadow-lg"></div>
            </div>
          ) : activeReservations.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="w-12 h-12 text-indigo-600" />
              </div>
              <p className="text-gray-700 text-xl font-bold mb-2">이용하고 있는 좌석이 없습니다</p>
              <p className="text-gray-500 text-sm">이용할 좌석을 선택해 보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeReservations.map((reservation) => (
                <Card key={reservation.id} className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md">
                          <span className="text-2xl font-bold text-white">
                            {reservation.seatNumber}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-800">
                            {reservation.seatNumber}번 좌석
                          </CardTitle>
                          <p className="text-sm text-gray-600 flex items-center gap-1 font-medium mt-1">
                            <User className="w-4 h-4 text-indigo-600" />
                            {reservation.userName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(reservation.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(reservation)}
                          disabled={loading}
                          className="flex items-center gap-1 font-semibold hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelClick(reservation)}
                          disabled={cancellingId === reservation.id}
                          className="flex items-center gap-1 font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md transition-all"
                        >
                          {cancellingId === reservation.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                              취소 중...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              취소
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-gray-700">날짜:</span>
                        <span className="font-bold">{format(new Date(reservation.date), 'PPP', { locale: ko })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-gray-700">시작:</span>
                        <span className="font-bold">{reservation.timeSlot.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-gray-700">이용:</span>
                        <span className="font-bold">{reservation.duration}시간</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-gray-700">종료:</span>
                        <span className="font-bold">{calculateEndTime(reservation.timeSlot.startTime, reservation.duration)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-indigo-600 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-bold mb-1">예약 정보</p>
                          <p className="font-medium">예약 시간: {format(new Date(reservation.createdAt), 'PPP p', { locale: ko })}</p>
                          <p className="font-medium text-xs text-gray-600 mt-1">예약 ID: {reservation.id}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center bg-gray-50 -m-6 mt-6 p-6 rounded-b-xl">
          <p className="text-sm font-bold text-gray-700">
            총 <span className="text-indigo-600 text-lg">{activeReservations.length}</span>개의 활성 예약
          </p>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="font-semibold hover:bg-gray-100 transition-all">
            닫기
          </Button>
        </div>
      </DialogContent>
      
      {/* 취소 확인 다이얼로그 */}
      <CancelReservationDialog
        reservation={selectedReservation}
        isOpen={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedReservation(null);
        }}
        onConfirm={handleConfirmCancel}
        loading={cancellingId !== null}
      />

      {/* 수정 다이얼로그 */}
      <EditReservationDialog
        reservation={selectedReservation}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedReservation(null);
        }}
        onSave={handleConfirmEdit}
        loading={loading}
      />
    </Dialog>
  );
}
