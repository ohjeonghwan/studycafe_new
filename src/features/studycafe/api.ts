import { Reservation, ReservationFormData } from './lib/types';

// 임시 로컬 스토리지 기반 예약 관리 (실제로는 Supabase나 다른 API 사용)
const RESERVATIONS_KEY = 'studycafe_reservations';

export const reservationApi = {
  // 모든 예약 조회
  getAllReservations: (): Reservation[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(RESERVATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('예약 데이터 조회 실패:', error);
      return [];
    }
  },

  // 특정 좌석의 예약 조회
  getReservationsBySeat: (seatNumber: number): Reservation[] => {
    const allReservations = reservationApi.getAllReservations();
    return allReservations.filter(reservation => reservation.seatNumber === seatNumber);
  },

  // 특정 날짜의 예약 조회
  getReservationsByDate: (date: Date): Reservation[] => {
    const allReservations = reservationApi.getAllReservations();
    const targetDate = new Date(date).toDateString();
    
    return allReservations.filter(reservation => {
      const reservationDate = new Date(reservation.date).toDateString();
      return reservationDate === targetDate;
    });
  },

  // 예약 생성
  createReservation: (formData: ReservationFormData): Promise<Reservation> => {
    return new Promise((resolve, reject) => {
      try {
        const reservations = reservationApi.getAllReservations();
        
        // 중복 예약 체크
        const existingReservation = reservations.find(reservation => {
          const isSameSeat = reservation.seatNumber === formData.seatNumber;
          const isSameDate = new Date(reservation.date).toDateString() === new Date(formData.date).toDateString();
          const isSameTime = reservation.timeSlot.id === formData.timeSlot.id;
          
          return isSameSeat && isSameDate && isSameTime && reservation.status === 'active';
        });

        if (existingReservation) {
          reject(new Error('해당 시간대에 이미 예약된 좌석입니다.'));
          return;
        }

        const newReservation: Reservation = {
          id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...formData,
          createdAt: new Date(),
          status: 'active',
        };

        reservations.push(newReservation);
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));

        resolve(newReservation);
      } catch (error) {
        reject(error);
      }
    });
  },

  // 예약 취소
  cancelReservation: (reservationId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const reservations = reservationApi.getAllReservations();
        const updatedReservations = reservations.map(reservation => {
          if (reservation.id === reservationId) {
            return { ...reservation, status: 'cancelled' as const };
          }
          return reservation;
        });

        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updatedReservations));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  // 예약 수정
  updateReservation: (reservationId: string, formData: ReservationFormData): Promise<Reservation> => {
    return new Promise((resolve, reject) => {
      try {
        const reservations = reservationApi.getAllReservations();
        const targetReservation = reservations.find(r => r.id === reservationId);
        
        if (!targetReservation) {
          reject(new Error('예약을 찾을 수 없습니다.'));
          return;
        }

        // 중복 예약 체크 (자기 자신 제외)
        const existingReservation = reservations.find(reservation => {
          if (reservation.id === reservationId) return false; // 자기 자신은 제외
          
          const isSameSeat = reservation.seatNumber === formData.seatNumber;
          const isSameDate = new Date(reservation.date).toDateString() === new Date(formData.date).toDateString();
          const isSameTime = reservation.timeSlot.id === formData.timeSlot.id;
          
          return isSameSeat && isSameDate && isSameTime && reservation.status === 'active';
        });

        if (existingReservation) {
          reject(new Error('해당 시간대에 이미 예약된 좌석입니다.'));
          return;
        }

        // 예약 수정
        const updatedReservations = reservations.map(reservation => {
          if (reservation.id === reservationId) {
            return {
              ...reservation,
              ...formData,
              // id, createdAt, status는 유지
            };
          }
          return reservation;
        });

        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updatedReservations));
        
        const updatedReservation = updatedReservations.find(r => r.id === reservationId);
        if (!updatedReservation) {
          reject(new Error('예약 수정에 실패했습니다.'));
          return;
        }
        
        resolve(updatedReservation);
      } catch (error) {
        reject(error);
      }
    });
  },

  // 예약 완료
  completeReservation: (reservationId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const reservations = reservationApi.getAllReservations();
        const updatedReservations = reservations.map(reservation => {
          if (reservation.id === reservationId) {
            return { ...reservation, status: 'completed' as const };
          }
          return reservation;
        });

        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updatedReservations));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  // 특정 좌석의 활성 예약 조회
  getActiveReservationBySeat: (seatNumber: number, date: Date): Reservation | null => {
    const reservations = reservationApi.getReservationsBySeat(seatNumber);
    const targetDate = new Date(date).toDateString();
    
    return reservations.find(reservation => {
      const reservationDate = new Date(reservation.date).toDateString();
      return reservationDate === targetDate && reservation.status === 'active';
    }) || null;
  },

  // 만료된 예약 자동 완료 처리
  autoCompleteExpiredReservations: (): number => {
    try {
      const reservations = reservationApi.getAllReservations();
      const now = new Date();
      let completedCount = 0;

      const updatedReservations = reservations.map(reservation => {
        // 이미 완료되었거나 취소된 예약은 건너뛰기
        if (reservation.status !== 'active') {
          return reservation;
        }

        // 예약 종료 시간 계산
        const reservationDate = new Date(reservation.date);
        const [endHour, endMinute] = reservation.timeSlot.endTime.split(':').map(Number);
        
        const reservationEndTime = new Date(reservationDate);
        reservationEndTime.setHours(endHour, endMinute || 0, 0, 0);

        // 현재 시간이 예약 종료 시간을 지났으면 완료 처리
        if (now >= reservationEndTime) {
          completedCount++;
          return { ...reservation, status: 'completed' as const };
        }

        return reservation;
      });

      if (completedCount > 0) {
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updatedReservations));
      }

      return completedCount;
    } catch (error) {
      console.error('만료된 예약 완료 처리 실패:', error);
      return 0;
    }
  },
};

