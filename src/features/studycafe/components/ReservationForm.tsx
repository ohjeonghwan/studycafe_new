'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Clock, User, Timer, AlertTriangle } from 'lucide-react';
import { ReservationFormData, TimeSlot } from '../lib/types';

interface ReservationFormProps {
  seatNumber: number;
  onReserve: (data: ReservationFormData) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeSlots: TimeSlot[] = [
  { id: 'hour_06', startTime: '06:00', endTime: '07:00', label: '06:00' },
  { id: 'hour_07', startTime: '07:00', endTime: '08:00', label: '07:00' },
  { id: 'hour_08', startTime: '08:00', endTime: '09:00', label: '08:00' },
  { id: 'hour_09', startTime: '09:00', endTime: '10:00', label: '09:00' },
  { id: 'hour_10', startTime: '10:00', endTime: '11:00', label: '10:00' },
  { id: 'hour_11', startTime: '11:00', endTime: '12:00', label: '11:00' },
  { id: 'hour_12', startTime: '12:00', endTime: '13:00', label: '12:00' },
  { id: 'hour_13', startTime: '13:00', endTime: '14:00', label: '13:00' },
  { id: 'hour_14', startTime: '14:00', endTime: '15:00', label: '14:00' },
  { id: 'hour_15', startTime: '15:00', endTime: '16:00', label: '15:00' },
  { id: 'hour_16', startTime: '16:00', endTime: '17:00', label: '16:00' },
  { id: 'hour_17', startTime: '17:00', endTime: '18:00', label: '17:00' },
  { id: 'hour_18', startTime: '18:00', endTime: '19:00', label: '18:00' },
  { id: 'hour_19', startTime: '19:00', endTime: '20:00', label: '19:00' },
  { id: 'hour_20', startTime: '20:00', endTime: '21:00', label: '20:00' },
  { id: 'hour_21', startTime: '21:00', endTime: '22:00', label: '21:00' },
  { id: 'hour_22', startTime: '22:00', endTime: '23:00', label: '22:00' },
  { id: 'hour_23', startTime: '23:00', endTime: '24:00', label: '23:00' },
];

const durationOptions = [
  { value: 1, label: '1시간' },
  { value: 2, label: '2시간' },
  { value: 3, label: '3시간' },
  { value: 4, label: '4시간' },
  { value: 6, label: '6시간' },
  { value: 8, label: '8시간' },
  { value: 12, label: '12시간' },
];

export default function ReservationForm({ seatNumber, onReserve, isOpen, onOpenChange }: ReservationFormProps) {
  const [formData, setFormData] = useState<Partial<ReservationFormData>>({
    seatNumber,
    date: new Date(),
    userName: '',
    duration: 2,
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 폼이 열릴 때 에러 메시지 초기화 및 좌석 번호 업데이트
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSelectedTimeSlot(null);
      // 좌석 번호 업데이트
      setFormData(prev => ({
        ...prev,
        seatNumber: seatNumber,
        date: new Date(),
        userName: '',
        duration: 2,
      }));
    }
  }, [isOpen, seatNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !selectedTimeSlot || !formData.userName || !formData.duration) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const reservationData: ReservationFormData = {
      seatNumber: formData.seatNumber!,
      date: formData.date,
      timeSlot: selectedTimeSlot,
      userName: formData.userName,
      duration: formData.duration,
    };

    onReserve(reservationData);
    
    // 폼 초기화
    setFormData({
      seatNumber,
      date: new Date(),
      userName: '',
      duration: 2,
    });
    setSelectedTimeSlot(null);
    onOpenChange(false);
  };

  // 시간대가 지났는지 확인하는 함수
  const isTimeSlotPassed = (date: Date, timeSlot: TimeSlot): boolean => {
    const now = new Date();
    const selectedDate = new Date(date);
    const [hours] = timeSlot.startTime.split(':').map(Number);
    
    // 오늘 날짜인 경우 시간 체크 (현재 시간 이전은 지난 시간)
    if (selectedDate.toDateString() === now.toDateString()) {
      return hours < now.getHours();
    }
    
    // 지난 날짜인 경우
    return selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

  const handleInputChange = (field: keyof ReservationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // 날짜나 시간이 변경되면 에러 메시지 초기화
    if (field === 'date' || selectedTimeSlot) {
      setErrorMessage('');
    }
  };

  const handleTimeSlotChange = (timeSlotId: string) => {
    const timeSlot = timeSlots.find(ts => ts.id === timeSlotId);
    if (!timeSlot) return;

    // 시간 검증
    if (formData.date && isTimeSlotPassed(formData.date, timeSlot)) {
      setErrorMessage('지난 시간대는 선택할 수 없습니다. 현재 시간 이후의 시간대를 선택해주세요.');
      setSelectedTimeSlot(null);
      return;
    }

    setSelectedTimeSlot(timeSlot);
    setErrorMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 -m-6 mb-6 p-6 rounded-t-xl">
          <DialogTitle className="flex items-center gap-2 text-white text-xl">
            <Clock className="w-6 h-6" />
            좌석 {formData.seatNumber || seatNumber}번 이용하기
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 날짜 선택 */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              이용 날짜
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP", { locale: ko }) : "날짜를 선택하세요"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => handleInputChange('date', date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 시간 선택 */}
          <div className="space-y-2">
            <Label htmlFor="timeSlot" className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Clock className="w-4 h-4 text-indigo-600" />
              시작 시간
            </Label>
            <Select value={selectedTimeSlot?.id} onValueChange={handleTimeSlotChange}>
              <SelectTrigger>
                <SelectValue placeholder="시작 시간을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => {
                  const isDisabled = formData.date ? isTimeSlotPassed(formData.date, slot) : false;
                  return (
                    <SelectItem 
                      key={slot.id} 
                      value={slot.id}
                      disabled={isDisabled}
                      className={isDisabled ? 'text-gray-400 cursor-not-allowed' : ''}
                    >
                      {slot.label} {isDisabled ? '(지난 시간)' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errorMessage && (
              <div className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}
          </div>

          {/* 이용자 이름 */}
          <div className="space-y-2">
            <Label htmlFor="userName" className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <User className="w-4 h-4 text-indigo-600" />
              이용자 이름
            </Label>
            <Input
              id="userName"
              placeholder="이름을 입력하세요"
              value={formData.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              required
            />
          </div>

          {/* 이용시간 */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Timer className="w-4 h-4 text-indigo-600" />
              이용시간
            </Label>
            <Select value={formData.duration?.toString()} onValueChange={(value) => handleInputChange('duration', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="이용시간을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 예약 정보 요약 */}
          {formData.date && selectedTimeSlot && formData.userName && formData.duration && (
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md animate-slide-up">
              <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                예약 정보
              </h4>
              <div className="space-y-2 text-sm font-medium text-blue-900">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">좌석:</span>
                  <span className="font-bold">{formData.seatNumber || seatNumber}번</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">날짜:</span>
                  <span className="font-bold">{format(formData.date, "PPP", { locale: ko })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">시작 시간:</span>
                  <span className="font-bold">{selectedTimeSlot.startTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">이용자:</span>
                  <span className="font-bold">{formData.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">이용 시간:</span>
                  <span className="font-bold">{formData.duration}시간</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">종료 시간:</span>
                  <span className="font-bold">{calculateEndTime(selectedTimeSlot.startTime, formData.duration)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 font-semibold hover:bg-gray-100 transition-all">
              취소
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all">
              이용하기
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
