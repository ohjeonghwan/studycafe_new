import { Seat } from './types';

const SEAT_FEATURES_KEY = 'studycafe_seat_features';

// 좌석 특징을 로컬 스토리지에 저장
export const saveSeatFeatures = (seatId: number, features: Partial<Seat>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(SEAT_FEATURES_KEY);
    const seatFeatures = stored ? JSON.parse(stored) : {};
    
    seatFeatures[seatId] = {
      ...seatFeatures[seatId],
      ...features,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(SEAT_FEATURES_KEY, JSON.stringify(seatFeatures));
  } catch (error) {
    console.error('좌석 특징 저장 실패:', error);
  }
};

// 로컬 스토리지에서 특정 좌석의 특징 불러오기
export const loadSeatFeatures = (seatId: number): Partial<Seat> | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(SEAT_FEATURES_KEY);
    if (!stored) return null;
    
    const seatFeatures = JSON.parse(stored);
    return seatFeatures[seatId] || null;
  } catch (error) {
    console.error('좌석 특징 불러오기 실패:', error);
    return null;
  }
};

// 모든 좌석 특징 불러오기
export const loadAllSeatFeatures = (): Record<number, Partial<Seat>> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(SEAT_FEATURES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('좌석 특징 불러오기 실패:', error);
    return {};
  }
};

// 좌석 배열에 저장된 특징 적용
export const applyStoredFeatures = (seats: Seat[]): Seat[] => {
  const storedFeatures = loadAllSeatFeatures();
  
  return seats.map(seat => {
    const features = storedFeatures[seat.id];
    if (features) {
      return {
        ...seat,
        hasOutlet: features.hasOutlet ?? seat.hasOutlet,
        isWindow: features.isWindow ?? seat.isWindow,
        isQuiet: features.isQuiet ?? seat.isQuiet,
        isGroup: features.isGroup ?? seat.isGroup,
      };
    }
    return seat;
  });
};

// 모든 좌석 특징 초기화
export const clearAllSeatFeatures = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SEAT_FEATURES_KEY);
  } catch (error) {
    console.error('좌석 특징 초기화 실패:', error);
  }
};





