'use client';

import { useState, useEffect } from 'react';
import { Seat, ReservationFormData } from '../lib/types';
import SeatComponent from './Seat';
import ReservationForm from './ReservationForm';
import ReservationList from './ReservationList';
import SeatFeatureEditor from './SeatFeatureEditor';
import { useReservations } from '../hooks/useReservations';
import { applyStoredFeatures, saveSeatFeatures } from '../lib/seatStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Heart, ArrowLeftRight, Calendar, Maximize, Minimize } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SeatMapProps {
  seats: Seat[];
  onSeatClick?: (seat: Seat) => void;
}

export default function SeatMap({ seats, onSeatClick }: SeatMapProps) {
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isReservationFormOpen, setIsReservationFormOpen] = useState(false);
  const [currentSeats, setCurrentSeats] = useState<Seat[]>(seats);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFeatureEditorOpen, setIsFeatureEditorOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [scale, setScale] = useState(1);
  
  const { createReservation, cancelReservation, updateReservation, updateSeatStatus, getActiveReservationBySeat, reservations, loading, error } = useReservations();
  const { toast } = useToast();

  // 클라이언트 마운트 후 저장된 좌석 특징 적용
  useEffect(() => {
    setIsMounted(true);
    const seatsWithFeatures = applyStoredFeatures(seats);
    const updatedSeats = updateSeatStatus(seatsWithFeatures, selectedDate);
    setCurrentSeats(updatedSeats);
  }, []);

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeat(seat);
    
    // 좌석이 이용 가능한 경우 바로 예약 폼 열기
    if (seat.status === 'available') {
      // 선택된 날짜가 지난 날짜인지 확인
      const today = new Date();
      const currentSelectedDate = new Date(selectedDate);
      today.setHours(0, 0, 0, 0);
      currentSelectedDate.setHours(0, 0, 0, 0);
      
      if (currentSelectedDate < today) {
        alert('지난 날짜는 예약할 수 없습니다. 오늘 이후의 날짜를 선택해주세요.');
        return;
      }
      
      setIsReservationFormOpen(true);
    }
    
    if (onSeatClick) {
      onSeatClick(seat);
    }
  };

  const handleReservation = async (formData: ReservationFormData) => {
    try {
      await createReservation(formData);
      // reservations 상태가 업데이트되면 useEffect가 자동으로 좌석 상태를 업데이트합니다
    } catch (err) {
      console.error('예약 실패:', err);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSeatRightClick = (seat: Seat) => {
    setEditingSeat(seat);
    setIsFeatureEditorOpen(true);
  };

  const handleSeatFeatureUpdate = (seatId: number, features: Partial<Seat>) => {
    // 로컬 스토리지에 저장
    saveSeatFeatures(seatId, features);
    
    // 좌석 특징 업데이트
    setCurrentSeats(prev => 
      prev.map(seat => 
        seat.id === seatId 
          ? { ...seat, ...features }
          : seat
      )
    );
    
    // 성공 알림
    toast({
      title: '좌석 특징 업데이트',
      description: `좌석 ${currentSeats.find(s => s.id === seatId)?.number}번의 특징이 업데이트되었습니다.`,
      variant: 'default',
    });
  };


  // 날짜 변경 시 좌석 상태 업데이트 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;
    const seatsWithFeatures = applyStoredFeatures(seats);
    const updatedSeats = updateSeatStatus(seatsWithFeatures, selectedDate);
    setCurrentSeats(updatedSeats);
  }, [selectedDate, seats, updateSeatStatus, isMounted]);

  // 예약 상태 변경 시 좌석 상태 업데이트 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;
    const seatsWithFeatures = applyStoredFeatures(seats);
    const updatedSeats = updateSeatStatus(seatsWithFeatures, selectedDate);
    setCurrentSeats(updatedSeats);
  }, [reservations, seats, selectedDate, updateSeatStatus, isMounted]);

  // 전체 화면 모드에서 배치도 크기에 맞춰 scale 계산
  useEffect(() => {
    if (!isFullscreen) {
      setScale(1);
      return;
    }

    const calculateScale = () => {
      const SEAT_MAP_WIDTH = 1851;
      const SEAT_MAP_HEIGHT = 987;
      const HEADER_HEIGHT = 80; // 헤더 예상 높이 더욱 줄임
      const PADDING = 10; // 여백 최소화
      
      const availableWidth = window.innerWidth - PADDING;
      const availableHeight = window.innerHeight - HEADER_HEIGHT - PADDING;
      
      const scaleX = availableWidth / SEAT_MAP_WIDTH;
      const scaleY = availableHeight / SEAT_MAP_HEIGHT;
      
      // 둘 중 작은 값을 사용하여 화면에 맞게 조정 (최대 제한 제거)
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    return () => {
      window.removeEventListener('resize', calculateScale);
    };
  }, [isFullscreen]);

  // 좌석을 구역별로 그룹화
  const getSeatsByRange = (start: number, end: number) => {
    return currentSeats.filter(seat => seat.number >= start && seat.number <= end);
  };

  const getSeatsByNumbers = (numbers: number[]) => {
    return currentSeats.filter(seat => numbers.includes(seat.number));
  };

  return (
    <Card className={`w-full mx-auto border-0 shadow-2xl ${isFullscreen ? 'max-w-none fixed inset-0 z-50 m-0 rounded-none bg-transparent' : 'max-w-4xl'}`} style={isFullscreen ? {} : { marginLeft: '5px', marginRight: '5px' }}>
      <CardHeader className={`text-center flex flex-col items-center justify-center ${isFullscreen ? 'min-h-[50px] py-1 bg-white/10 backdrop-blur-md' : 'min-h-[140px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'} rounded-t-xl`}>
        <CardTitle className={`font-extrabold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent ${isFullscreen ? 'text-xl mb-0' : 'text-4xl mb-2'}`}>예닮 스터디카페</CardTitle>
        <p className={`text-blue-100 font-medium ${isFullscreen ? 'text-sm hidden' : 'text-lg'}`}>실시간 좌석 현황</p>
        
        {/* 날짜 선택 및 컨트롤 버튼들 */}
        <div className={`flex items-center justify-center gap-4 flex-wrap ${isFullscreen ? 'mt-1' : 'mt-6'}`}>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
            <Calendar className="w-4 h-4 text-white" />
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-1.5 border-2 border-white/30 bg-white/90 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <ReservationList
              reservations={reservations}
              onCancelReservation={cancelReservation}
              onUpdateReservation={updateReservation}
              loading={loading}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-2 bg-white/90 hover:bg-white border-white/30 text-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4" />
                  축소
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4" />
                  전체화면
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={isFullscreen ? 'h-full flex items-center justify-center overflow-hidden pb-5 bg-transparent' : 'pt-6'}>
        <div 
          className={`relative rounded-2xl p-8 mx-auto ${isFullscreen ? 'bg-white shadow-2xl' : 'bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner'}`} 
          style={isFullscreen ? { 
            width: '1851px', 
            height: '987px',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease-in-out',
            marginBottom: '80px'
          } : { 
            width: '1851px', 
            height: '987px' 
          }}
        >
          {/* 좌석 배치도 */}
          <div className="relative w-full h-full">
            
            {/* Top Section */}
            <div className="flex justify-between items-start" style={{ marginBottom: '0px' }}>
              {/* Top-left area - 좌석 6-12 (green) + 13번 + 14-21 (pink) */}
              <div className="flex gap-2">
                {/* 좌석 6-12 (green) + 13번 - 세로 배치 */}
                <div className="flex flex-col gap-1">
                  {getSeatsByRange(6, 12).map(seat => (
                    <SeatComponent
                      key={seat.id}
                      seat={seat}
                      onClick={handleSeatClick}
                      onRightClick={handleSeatRightClick}
                    />
                  ))}
                  {/* 13번 좌석 추가 */}
                  {getSeatsByRange(13, 13).map(seat => (
                    <SeatComponent
                      key={seat.id}
                      seat={seat}
                      onClick={handleSeatClick}
                      onRightClick={handleSeatRightClick}
                    />
                  ))}
                </div>
                
                {/* 좌석 14-21 (pink) - 가로 배치 */}
                <div className="flex gap-1">
                  {getSeatsByRange(14, 21).map(seat => (
                    <SeatComponent
                      key={seat.id}
                      seat={seat}
                      onClick={handleSeatClick}
                      onRightClick={handleSeatRightClick}
                    />
                  ))}
                </div>
              </div>
              
              {/* Far right area - 좌석 22-26 (light blue) + 27-35 (white) */}
              <div className="flex" style={{ gap: '5px' }}>
                {/* 좌석 22-26 (light blue) - 가로 배치 */}
                <div className="flex gap-1">
                  {getSeatsByRange(22, 26).map(seat => (
                    <SeatComponent
                      key={seat.id}
                      seat={seat}
                      onClick={handleSeatClick}
                      onRightClick={handleSeatRightClick}
                    />
                  ))}
                </div>
                
                {/* 좌석 27-35 (white) - 세로 배치 */}
                <div className="flex flex-col gap-1">
                  {getSeatsByRange(27, 35).map(seat => (
                    <SeatComponent
                      key={seat.id}
                      seat={seat}
                      onClick={handleSeatClick}
                      onRightClick={handleSeatRightClick}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 41-48 좌석 섹션 - 15번 좌석 아래 position으로 정확히 배치 */}
            <div className="absolute" style={{ left: '250px', top: '165px' }}>
              <div className="flex gap-2">
                {/* 좌석 41-48 */}
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {getSeatsByRange(41, 44).map(seat => (
                      <SeatComponent
                        key={seat.id}
                        seat={seat}
                        onClick={handleSeatClick}
                        onRightClick={handleSeatRightClick}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {getSeatsByRange(45, 48).map(seat => (
                      <SeatComponent
                        key={seat.id}
                        seat={seat}
                        onClick={handleSeatClick}
                        onRightClick={handleSeatRightClick}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 49-56 좌석 섹션 - 23번 좌석 아래 position으로 정확히 배치 */}
            <div className="absolute" style={{ left: '1200px', top: '165px' }}>
              <div className="flex gap-2">
                {/* 좌석 49-56 */}
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {getSeatsByRange(49, 52).map(seat => (
                      <SeatComponent
                        key={seat.id}
                        seat={seat}
                        onClick={handleSeatClick}
                        onRightClick={handleSeatRightClick}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {getSeatsByRange(53, 56).map(seat => (
                      <SeatComponent
                        key={seat.id}
                        seat={seat}
                        onClick={handleSeatClick}
                        onRightClick={handleSeatRightClick}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>


            {/* Bottom Section */}
            <div className="flex justify-between items-end">
              {/* Bottom-left row - 좌석 1-5 (light blue) */}
              <div className="flex gap-1" style={{ marginLeft: '80px', marginBottom: '50px' }}>
                {getSeatsByRange(1, 5).map(seat => (
                  <SeatComponent
                    key={seat.id}
                    seat={seat}
                    onClick={handleSeatClick}
                    onRightClick={handleSeatRightClick}
                  />
                ))}
              </div>

              {/* Information Box */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border-2 border-indigo-200" style={{ marginBottom: '50px' }}>
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-base font-bold text-indigo-900">
                    <ArrowLeftRight className="w-6 h-6 text-indigo-600" />
                    → 입구 입구 ←
                  </div>
                  <div className="flex items-center justify-center gap-2 text-base font-semibold text-gray-800">
                    <Check className="w-6 h-6 text-green-600" />
                    자리체크
                  </div>
                  <div className="flex items-center justify-center gap-2 text-base font-semibold text-gray-800">
                    <Heart className="w-6 h-6 text-red-500" />
                    ♡ 헌금함
                  </div>
                  <div className="flex gap-2 justify-center mt-4">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-md"></div>
                    <div className="w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full shadow-md"></div>
                    <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-md"></div>
                  </div>
                </div>
              </div>

              {/* Bottom-right row - 좌석 36-40 (yellow, descending order) */}
              <div className="flex gap-1" style={{ marginRight: '80px', marginBottom: '50px' }}>
                {getSeatsByNumbers([40, 39, 38, 37, 36]).map(seat => (
                  <SeatComponent
                    key={seat.id}
                    seat={seat}
                    onClick={handleSeatClick}
                    onRightClick={handleSeatRightClick}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 범례 */}
          <div className="flex flex-wrap gap-3 justify-center bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-md" style={{ marginTop: '70px' }}>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
              <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-md animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700">이용 가능</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
              <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-gray-700">이용 중</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
              <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-gray-700">예약됨</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
              <div className="w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-gray-700">점검 중</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
              <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-gray-700">콘센트</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
              <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-gray-700">창가</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
              <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-gray-700">조용한 구역</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
              <div className="w-3 h-3 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-gray-700">그룹 스터디</span>
            </div>
          </div>

          {/* 선택된 좌석 정보 */}
          {selectedSeat && (
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 shadow-lg animate-slide-up">
              <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                선택된 좌석 정보
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                <div className="flex items-center gap-2">
                  좌석 번호: <Badge variant="outline" className="bg-white font-bold text-blue-700 border-blue-400">{selectedSeat.number}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  상태: <Badge variant="outline" className="bg-white font-bold border-blue-400">{selectedSeat.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  구역: <Badge variant="outline" className="bg-white font-bold border-blue-400">{selectedSeat.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  콘센트: <span className={selectedSeat.hasOutlet ? 'text-green-600 font-bold' : 'text-gray-400'}>
                    {selectedSeat.hasOutlet ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  창가: <span className={selectedSeat.isWindow ? 'text-cyan-600 font-bold' : 'text-gray-400'}>
                    {selectedSeat.isWindow ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  조용한 구역: <span className={selectedSeat.isQuiet ? 'text-purple-600 font-bold' : 'text-gray-400'}>
                    {selectedSeat.isQuiet ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  그룹 스터디: <span className={selectedSeat.isGroup ? 'text-indigo-600 font-bold' : 'text-gray-400'}>
                    {selectedSeat.isGroup ? '✓' : '✗'}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/70 backdrop-blur-sm rounded-lg">
                <div className="text-sm font-semibold">
                  {selectedSeat.status === 'available' ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      ✓ 예약 가능한 좌석입니다
                    </span>
                  ) : selectedSeat.status === 'reserved' ? (
                    <span className="text-orange-600 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      ⚠ 이미 예약된 좌석입니다
                    </span>
                  ) : selectedSeat.status === 'occupied' ? (
                    <span className="text-red-600 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      ✗ 현재 이용 중인 좌석입니다
                    </span>
                  ) : (
                    <span className="text-gray-600 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      🔧 점검 중인 좌석입니다
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* 예약 폼 */}
      {selectedSeat && (
        <ReservationForm
          seatNumber={selectedSeat.number}
          onReserve={handleReservation}
          isOpen={isReservationFormOpen}
          onOpenChange={setIsReservationFormOpen}
        />
      )}

      {/* 좌석 특징 편집기 */}
      <SeatFeatureEditor
        seat={editingSeat}
        isOpen={isFeatureEditorOpen}
        onClose={() => {
          setIsFeatureEditorOpen(false);
          setEditingSeat(null);
        }}
        onSave={handleSeatFeatureUpdate}
      />
    </Card>
  );
}
