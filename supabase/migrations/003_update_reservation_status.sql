-- 예약 상태 업데이트 마이그레이션
-- pending 상태 추가 및 기존 데이터 업데이트

BEGIN;

-- 예약 테이블의 status 컬럼 제약 조건 업데이트
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'no_show'));

-- 기존 예약 데이터의 상태를 pending으로 업데이트 (active였던 것들)
UPDATE reservations 
SET status = 'pending' 
WHERE status = 'active' 
AND start_time > NOW();

-- 예약 중복 방지 함수 업데이트
CREATE OR REPLACE FUNCTION prevent_overlapping_reservations()
RETURNS TRIGGER AS $$
BEGIN
    -- 같은 좌석에서 시간이 겹치는 예약이 있는지 확인
    IF EXISTS (
        SELECT 1 FROM reservations 
        WHERE seat_id = NEW.seat_id 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND status IN ('pending', 'active')
        AND (
            (NEW.start_time < end_time AND NEW.end_time > start_time)
        )
    ) THEN
        RAISE EXCEPTION 'Seat % is already reserved for the specified time period', NEW.seat_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 예약 생성 함수 업데이트 (pending 상태로 시작)
CREATE OR REPLACE FUNCTION create_reservation(
    p_user_id UUID,
    p_seat_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    reservation_id UUID;
BEGIN
    -- 좌석이 사용 가능한지 확인
    IF NOT EXISTS (SELECT 1 FROM seats WHERE id = p_seat_id AND is_available = true) THEN
        RAISE EXCEPTION 'Seat % is not available', p_seat_id;
    END IF;
    
    -- 사용자가 존재하는지 확인
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND is_active = true) THEN
        RAISE EXCEPTION 'User % is not active', p_user_id;
    END IF;
    
    -- 예약 생성 (pending 상태로 시작)
    INSERT INTO reservations (
        user_id, seat_id, start_time, end_time, notes, status
    ) VALUES (
        p_user_id, p_seat_id, p_start_time, p_end_time, p_notes, 'pending'
    ) RETURNING id INTO reservation_id;
    
    RETURN reservation_id;
END;
$$ LANGUAGE plpgsql;

-- 예약 상태 업데이트 함수 추가
CREATE OR REPLACE FUNCTION update_reservation_to_active(
    p_reservation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    reservation_record RECORD;
BEGIN
    -- 예약 정보 조회
    SELECT * INTO reservation_record 
    FROM reservations 
    WHERE id = p_reservation_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation not found or not in pending status';
    END IF;
    
    -- 예약 상태를 active로 업데이트
    UPDATE reservations 
    SET status = 'active', updated_at = NOW()
    WHERE id = p_reservation_id;
    
    -- 좌석 상태를 사용 중으로 업데이트
    UPDATE seats 
    SET is_available = false, updated_at = NOW()
    WHERE id = reservation_record.seat_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 예약 완료 함수 추가
CREATE OR REPLACE FUNCTION complete_reservation(
    p_reservation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    reservation_record RECORD;
BEGIN
    -- 예약 정보 조회
    SELECT * INTO reservation_record 
    FROM reservations 
    WHERE id = p_reservation_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation not found or not in active status';
    END IF;
    
    -- 예약 상태를 completed로 업데이트
    UPDATE reservations 
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_reservation_id;
    
    -- 좌석 상태를 사용 가능으로 업데이트
    UPDATE seats 
    SET is_available = true, updated_at = NOW()
    WHERE id = reservation_record.seat_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 함수 코멘트 업데이트
COMMENT ON FUNCTION create_reservation IS '예약을 pending 상태로 안전하게 생성하는 함수';
COMMENT ON FUNCTION update_reservation_to_active IS '예약을 active 상태로 업데이트하고 좌석을 사용 중으로 변경하는 함수';
COMMENT ON FUNCTION complete_reservation IS '예약을 완료 상태로 업데이트하고 좌석을 사용 가능으로 변경하는 함수';

COMMIT;

