'use client';

import { useState, useEffect, useCallback } from 'react';
import { Reservation, ReservationFormData, Seat, SeatStatus } from '../lib/types';
import { reservationApi } from '../api';
import { useToast } from '@/hooks/use-toast';

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // 예약 목록 가져오기
  const fetchReservations = useCallback(() => {
    try {
      // 만료된 예약 자동 완료 처리
      const completedCount = reservationApi.autoCompleteExpiredReservations();
      
      // 최신 예약 목록 가져오기
      const allReservations = reservationApi.getAllReservations();
      setReservations(allReservations);
      
      // 자동 완료된 예약이 있을 경우 토스트 메시지 표시 (선택사항)
      if (completedCount > 0) {
        console.log(`${completedCount}개의 예약이 자동으로 완료 처리되었습니다.`);
      }
    } catch (err) {
      console.error('예약 목록 조회 실패:', err);
      setError('예약 목록을 불러오는데 실패했습니다.');
    }
  }, []);

  // 예약 생성
  const createReservation = useCallback(async (formData: ReservationFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newReservation = await reservationApi.createReservation(formData);
      
      // 즉시 최신 예약 목록을 다시 가져와서 상태 업데이트
      const updatedReservations = reservationApi.getAllReservations();
      setReservations(updatedReservations);
      
      toast({
        title: '예약 완료',
        description: `좌석 ${formData.seatNumber}번이 성공적으로 예약되었습니다.`,
        variant: 'default',
      });
      
      return newReservation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '예약에 실패했습니다.';
      setError(errorMessage);
      
      toast({
        title: '예약 실패',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 예약 취소
  const cancelReservation = useCallback(async (reservationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await reservationApi.cancelReservation(reservationId);
      
      // 즉시 최신 예약 목록을 다시 가져와서 상태 업데이트
      const updatedReservations = reservationApi.getAllReservations();
      setReservations(updatedReservations);
      
      toast({
        title: '예약 취소',
        description: '예약이 취소되었습니다.',
        variant: 'default',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '예약 취소에 실패했습니다.';
      setError(errorMessage);
      
      toast({
        title: '취소 실패',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 예약 수정
  const updateReservation = useCallback(async (reservationId: string, formData: ReservationFormData): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await reservationApi.updateReservation(reservationId, formData);
      
      // 즉시 최신 예약 목록을 다시 가져와서 상태 업데이트
      const updatedReservations = reservationApi.getAllReservations();
      setReservations(updatedReservations);
      
      toast({
        title: '예약 수정',
        description: `좌석 ${formData.seatNumber}번 예약이 수정되었습니다.`,
        variant: 'default',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '예약 수정에 실패했습니다.';
      setError(errorMessage);
      
      toast({
        title: '수정 실패',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 예약 완료
  const completeReservation = useCallback(async (reservationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await reservationApi.completeReservation(reservationId);
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === reservationId 
            ? { ...reservation, status: 'completed' as const }
            : reservation
        )
      );
      
      toast({
        title: '이용 완료',
        description: '예약이 완료 처리되었습니다.',
        variant: 'default',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '완료 처리에 실패했습니다.';
      setError(errorMessage);
      
      toast({
        title: '완료 실패',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 특정 좌석의 활성 예약 조회
  const getActiveReservationBySeat = useCallback((seatNumber: number, date: Date): Reservation | null => {
    const targetDate = new Date(date).toDateString();
    
    return reservations.find(reservation => {
      const reservationDate = new Date(reservation.date).toDateString();
      return (
        reservation.seatNumber === seatNumber &&
        reservationDate === targetDate &&
        reservation.status === 'active'
      );
    }) || null;
  }, [reservations]);

  // 좌석 상태 업데이트 (날짜 기반)
  const updateSeatStatus = useCallback((seats: Seat[], selectedDate: Date): Seat[] => {
    return seats.map(seat => {
      const activeReservation = getActiveReservationBySeat(seat.number, selectedDate);
      
      if (activeReservation) {
        // 예약이 있는 경우
        const reservationDate = new Date(activeReservation.date);
        const now = new Date();
        const [startHour] = activeReservation.timeSlot.startTime.split(':').map(Number);
        const [endHour] = activeReservation.timeSlot.endTime.split(':').map(Number);
        
        // 예약 시간대 체크
        const reservationStartTime = new Date(reservationDate);
        reservationStartTime.setHours(startHour, 0, 0, 0);
        
        const reservationEndTime = new Date(reservationDate);
        reservationEndTime.setHours(endHour, 0, 0, 0);
        
        // 현재 시간이 예약 시간대 내에 있으면 'occupied', 아니면 'reserved'
        if (now >= reservationStartTime && now < reservationEndTime) {
          return { ...seat, status: 'occupied' as SeatStatus };
        } else {
          return { ...seat, status: 'reserved' as SeatStatus };
        }
      }
      
      // 예약이 없는 경우 available
      return { ...seat, status: 'available' as SeatStatus };
    });
  }, [getActiveReservationBySeat]);

  // 특정 날짜의 예약 목록 조회
  const getReservationsByDate = useCallback((date: Date): Reservation[] => {
    const targetDate = new Date(date).toDateString();
    
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.date).toDateString();
      return reservationDate === targetDate && reservation.status === 'active';
    });
  }, [reservations]);

  // 컴포넌트 마운트 시 예약 목록 가져오기
  useEffect(() => {
    fetchReservations();
    
    // 30초마다 예약 목록 갱신 및 만료된 예약 자동 완료 처리
    const interval = setInterval(() => {
      fetchReservations();
    }, 30000); // 30초
    
    return () => clearInterval(interval);
  }, [fetchReservations]);

  return {
    reservations,
    loading,
    error,
    createReservation,
    cancelReservation,
    updateReservation,
    completeReservation,
    getActiveReservationBySeat,
    updateSeatStatus,
    getReservationsByDate,
    fetchReservations,
  };
}




