'use client';

import { useState, useEffect, useCallback } from 'react';
import { Seat, SeatStatus } from '../lib/types';
import { seatMapData } from '../lib/seatData';

export function useSeatMap() {
  const [seats, setSeats] = useState<Seat[]>(seatMapData.seats);
  const [isLoading, setIsLoading] = useState(true);

  // 좌석 상태 업데이트
  const updateSeatStatus = useCallback((seatId: number, status: SeatStatus) => {
    setSeats(prevSeats => 
      prevSeats.map(seat => 
        seat.id === seatId ? { ...seat, status } : seat
      )
    );
  }, []);

  // 좌석 예약
  const reserveSeat = useCallback((seatId: number) => {
    updateSeatStatus(seatId, 'reserved');
  }, [updateSeatStatus]);

  // 좌석 이용 시작
  const occupySeat = useCallback((seatId: number) => {
    updateSeatStatus(seatId, 'occupied');
  }, [updateSeatStatus]);

  // 좌석 이용 종료
  const releaseSeat = useCallback((seatId: number) => {
    updateSeatStatus(seatId, 'available');
  }, [updateSeatStatus]);

  // 좌석 점검 모드
  const setMaintenanceMode = useCallback((seatId: number) => {
    updateSeatStatus(seatId, 'maintenance');
  }, [updateSeatStatus]);

  // 통계 계산
  const getSeatStats = useCallback(() => {
    const total = seats.length;
    const available = seats.filter(seat => seat.status === 'available').length;
    const occupied = seats.filter(seat => seat.status === 'occupied').length;
    const reserved = seats.filter(seat => seat.status === 'reserved').length;
    const maintenance = seats.filter(seat => seat.status === 'maintenance').length;
    
    return {
      total,
      available,
      occupied,
      reserved,
      maintenance,
      utilizationRate: Math.round(((occupied + reserved) / total) * 100)
    };
  }, [seats]);

  // 구역별 통계
  const getZoneStats = useCallback(() => {
    const zones = {
      pink: seats.filter(seat => seat.type === 'pink'),
      'light-blue': seats.filter(seat => seat.type === 'light-blue'),
      white: seats.filter(seat => seat.type === 'white'),
      green: seats.filter(seat => seat.type === 'green'),
      yellow: seats.filter(seat => seat.type === 'yellow'),
    };

    return Object.entries(zones).map(([zone, zoneSeats]) => ({
      zone,
      total: zoneSeats.length,
      available: zoneSeats.filter(seat => seat.status === 'available').length,
      occupied: zoneSeats.filter(seat => seat.status === 'occupied').length,
      reserved: zoneSeats.filter(seat => seat.status === 'reserved').length,
      maintenance: zoneSeats.filter(seat => seat.status === 'maintenance').length,
    }));
  }, [seats]);

  // 편의시설 통계
  const getFacilityStats = useCallback(() => {
    return {
      withOutlet: seats.filter(seat => seat.hasOutlet).length,
      windowSeats: seats.filter(seat => seat.isWindow).length,
      quietZone: seats.filter(seat => seat.isQuiet).length,
      groupStudy: seats.filter(seat => seat.isGroup).length,
    };
  }, [seats]);

  // 초기 로딩 시뮬레이션
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    seats,
    isLoading,
    updateSeatStatus,
    reserveSeat,
    occupySeat,
    releaseSeat,
    setMaintenanceMode,
    getSeatStats,
    getZoneStats,
    getFacilityStats,
  };
}
































