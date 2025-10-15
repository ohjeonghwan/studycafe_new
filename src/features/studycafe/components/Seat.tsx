'use client';

import { Seat, SeatStatus } from '../lib/types';
import { cn } from '@/lib/utils';

interface SeatProps {
  seat: Seat;
  onClick?: (seat: Seat) => void;
  onRightClick?: (seat: Seat) => void;
  className?: string;
}

const getSeatTypeStyles = (type: Seat['type']) => {
  switch (type) {
    case 'pink':
      return 'bg-gradient-to-br from-pink-300 to-pink-400 border-pink-500 hover:from-pink-400 hover:to-pink-500 hover:shadow-lg hover:shadow-pink-300/50';
    case 'light-blue':
      return 'bg-gradient-to-br from-blue-300 to-blue-400 border-blue-500 hover:from-blue-400 hover:to-blue-500 hover:shadow-lg hover:shadow-blue-300/50';
    case 'white':
      return 'bg-gradient-to-br from-white to-gray-50 border-gray-400 hover:from-gray-50 hover:to-gray-100 hover:shadow-lg hover:shadow-gray-300/50';
    case 'green':
      return 'bg-gradient-to-br from-green-300 to-green-400 border-green-500 hover:from-green-400 hover:to-green-500 hover:shadow-lg hover:shadow-green-300/50';
    case 'yellow':
      return 'bg-gradient-to-br from-yellow-300 to-yellow-400 border-yellow-500 hover:from-yellow-400 hover:to-yellow-500 hover:shadow-lg hover:shadow-yellow-300/50';
    case 'lime':
      return 'bg-gradient-to-br from-lime-300 to-lime-400 border-lime-500 hover:from-lime-400 hover:to-lime-500 hover:shadow-lg hover:shadow-lime-300/50';
    default:
      return 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500 hover:from-gray-400 hover:to-gray-500 hover:shadow-lg hover:shadow-gray-300/50';
  }
};

const getStatusStyles = (status: SeatStatus) => {
  switch (status) {
    case 'available':
      return 'border-green-500 shadow-lg shadow-green-300/40 ring-2 ring-green-400/30';
    case 'occupied':
      return 'border-red-500 shadow-lg shadow-red-300/40 bg-opacity-80 ring-2 ring-red-400/30';
    case 'reserved':
      return 'border-orange-500 shadow-lg shadow-orange-300/40 bg-opacity-80 ring-2 ring-orange-400/30';
    case 'maintenance':
      return 'border-gray-500 shadow-lg shadow-gray-300/40 bg-opacity-60 ring-2 ring-gray-400/30';
    default:
      return '';
  }
};

const getStatusDot = (status: SeatStatus) => {
  switch (status) {
    case 'available':
      return <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-md shadow-green-500/50 animate-pulse" />;
    case 'occupied':
      return <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-md shadow-red-500/50" />;
    case 'reserved':
      return <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-md shadow-orange-500/50" />;
    case 'maintenance':
      return <div className="w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full shadow-md shadow-gray-500/50" />;
    default:
      return null;
  }
};

const getFeatureDots = (seat: Seat) => {
  // 좌석 특징에 따라 오른쪽 점들을 배열로 반환
  const dots = [];
  
  if (seat.isGroup) {
    dots.push(
      <div key="group" className="w-3.5 h-3.5 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full shadow-md shadow-indigo-500/50" />
    );
  }
  
  if (seat.isQuiet) {
    dots.push(
      <div key="quiet" className="w-3.5 h-3.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-md shadow-purple-500/50" />
    );
  }
  
  if (seat.isWindow) {
    dots.push(
      <div key="window" className="w-3.5 h-3.5 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-md shadow-cyan-500/50" />
    );
  }
  
  if (seat.hasOutlet) {
    dots.push(
      <div key="outlet" className="w-3.5 h-3.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-md shadow-blue-500/50" />
    );
  }
  
  return dots;
};

export default function SeatComponent({ seat, onClick, onRightClick, className }: SeatProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(seat);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRightClick) {
      onRightClick(seat);
    }
  };

  const featureDots = getFeatureDots(seat);

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-center text-sm font-bold shadow-lg hover:scale-105 hover:-translate-y-1',
        getSeatTypeStyles(seat.type),
        getStatusStyles(seat.status),
        className
      )}
      style={{ width: '80px', height: '80px' }}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      {/* 좌석 번호 */}
      <span className="text-gray-800 text-lg drop-shadow-sm">{seat.number}</span>
      
      {/* 왼쪽 점: 상태 표시 (이용 가능, 이용 중, 예약됨, 점검 중) */}
      <div className="absolute -top-1.5 -left-1.5">
        {getStatusDot(seat.status)}
      </div>
      
      {/* 오른쪽 점들: 특징 표시 (그룹 스터디, 조용한 구역, 창가, 콘센트) */}
      {featureDots.length > 0 && (
        <div className="absolute -top-1.5 -right-1.5 flex gap-0.5">
          {featureDots}
        </div>
      )}
    </div>
  );
}
