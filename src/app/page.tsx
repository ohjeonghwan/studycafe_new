'use client';

import SeatMap from '@/features/studycafe/components/SeatMap';
import { seatMapData } from '@/features/studycafe/lib/seatData';

export default function Home() {
  return (
    <div className="min-h-screen py-8 px-4 relative z-10">
      <div className="space-y-8 animate-slide-up">
        <SeatMap 
          seats={seatMapData.seats} 
          onSeatClick={(seat) => {
            console.log('Selected seat:', seat);
          }}
        />
      </div>
    </div>
  );
}
