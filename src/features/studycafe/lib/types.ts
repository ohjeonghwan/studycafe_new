export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export type SeatType = 'pink' | 'light-blue' | 'white' | 'green' | 'yellow' | 'lime';

export interface Seat {
  id: number;
  number: number;
  type: SeatType;
  status: SeatStatus;
  hasOutlet?: boolean;
  isWindow?: boolean;
  isQuiet?: boolean;
  isGroup?: boolean;
}

export interface SeatMapData {
  title: string;
  subtitle: string;
  seats: Seat[];
}

// 예약 관련 타입
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

export interface ReservationFormData {
  seatNumber: number;
  date: Date;
  timeSlot: TimeSlot;
  userName: string;
  duration: number; // 이용시간 (시간 단위)
}

export interface Reservation extends ReservationFormData {
  id: string;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}


















