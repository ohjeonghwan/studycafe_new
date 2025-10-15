-- 사용자 테이블 생성
-- 스터디카페 예약 시스템을 위한 사용자 정보 관리

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  birth_date DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  
  -- 스터디카페 관련 정보
  membership_type VARCHAR(20) DEFAULT 'regular' CHECK (membership_type IN ('regular', 'premium', 'vip')),
  total_study_hours INTEGER DEFAULT 0,
  preferred_seat_area VARCHAR(20) CHECK (preferred_seat_area IN ('green', 'pink', 'blue', 'white', 'yellow')),
  
  -- 계정 상태 관리
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- 보안 및 알림 설정
  last_login_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  notification_enabled BOOLEAN DEFAULT true,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_membership_type ON users(membership_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 업데이트 시간 자동 갱신을 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회/수정할 수 있도록 정책 설정
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 사용자 정보를 조회/수정할 수 있도록 정책 설정 (추후 관리자 역할 추가 시)
-- CREATE POLICY "Admins can view all users" ON users
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM user_roles 
--             WHERE user_id = auth.uid() 
--             AND role = 'admin'
--         )
--     );

-- 댓글 및 설명
COMMENT ON TABLE users IS '스터디카페 사용자 정보 테이블';
COMMENT ON COLUMN users.id IS '사용자 고유 식별자 (UUID)';
COMMENT ON COLUMN users.email IS '사용자 이메일 주소';
COMMENT ON COLUMN users.password_hash IS '암호화된 비밀번호';
COMMENT ON COLUMN users.name IS '사용자 실명';
COMMENT ON COLUMN users.phone IS '연락처 전화번호';
COMMENT ON COLUMN users.birth_date IS '생년월일';
COMMENT ON COLUMN users.gender IS '성별 (male, female, other)';
COMMENT ON COLUMN users.membership_type IS '멤버십 유형 (regular, premium, vip)';
COMMENT ON COLUMN users.total_study_hours IS '누적 학습 시간 (분 단위)';
COMMENT ON COLUMN users.preferred_seat_area IS '선호하는 좌석 구역';
COMMENT ON COLUMN users.is_active IS '계정 활성화 상태';
COMMENT ON COLUMN users.is_verified IS '이메일 인증 여부';
COMMENT ON COLUMN users.last_login_at IS '마지막 로그인 시간';
COMMENT ON COLUMN users.failed_login_attempts IS '로그인 실패 횟수';
COMMENT ON COLUMN users.locked_until IS '계정 잠금 해제 시간';
COMMENT ON COLUMN users.notification_enabled IS '알림 수신 설정';

-- 중복 데이터 삽입 방지 및 데이터 보존을 위한 함수
CREATE OR REPLACE FUNCTION upsert_user(
    p_email VARCHAR(255),
    p_password_hash VARCHAR(255),
    p_name VARCHAR(100),
    p_phone VARCHAR(20) DEFAULT NULL,
    p_birth_date DATE DEFAULT NULL,
    p_gender VARCHAR(10) DEFAULT NULL,
    p_membership_type VARCHAR(20) DEFAULT 'regular',
    p_preferred_seat_area VARCHAR(20) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- 이메일로 기존 사용자 확인
    SELECT id INTO user_id FROM users WHERE email = p_email;
    
    IF user_id IS NOT NULL THEN
        -- 기존 사용자가 있으면 업데이트 (중요한 정보는 보존)
        UPDATE users SET
            name = COALESCE(p_name, name),
            phone = COALESCE(p_phone, phone),
            birth_date = COALESCE(p_birth_date, birth_date),
            gender = COALESCE(p_gender, gender),
            membership_type = COALESCE(p_membership_type, membership_type),
            preferred_seat_area = COALESCE(p_preferred_seat_area, preferred_seat_area),
            updated_at = NOW()
        WHERE id = user_id;
        
        RETURN user_id;
    ELSE
        -- 새 사용자 삽입
        INSERT INTO users (
            email, password_hash, name, phone, birth_date, 
            gender, membership_type, preferred_seat_area
        ) VALUES (
            p_email, p_password_hash, p_name, p_phone, p_birth_date,
            p_gender, p_membership_type, p_preferred_seat_area
        ) RETURNING id INTO user_id;
        
        RETURN user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 안전한 사용자 삽입을 위한 트리거 함수
CREATE OR REPLACE FUNCTION prevent_duplicate_user_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- 이메일 중복 체크
    IF EXISTS (SELECT 1 FROM users WHERE email = NEW.email AND id != NEW.id) THEN
        RAISE EXCEPTION 'User with email % already exists', NEW.email;
    END IF;
    
    -- 전화번호 중복 체크 (전화번호가 제공된 경우)
    IF NEW.phone IS NOT NULL AND EXISTS (
        SELECT 1 FROM users 
        WHERE phone = NEW.phone AND id != NEW.id AND phone IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'User with phone % already exists', NEW.phone;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 중복 방지 트리거 생성
CREATE TRIGGER prevent_duplicate_user_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_user_insert();

-- 스터디카페 좌석 테이블 생성 (데이터 보존)
CREATE TABLE IF NOT EXISTS seats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seat_number VARCHAR(10) NOT NULL,
    area VARCHAR(20) NOT NULL CHECK (area IN ('green', 'pink', 'blue', 'white', 'yellow')),
    seat_type VARCHAR(20) DEFAULT 'standard' CHECK (seat_type IN ('standard', 'premium', 'vip')),
    is_available BOOLEAN DEFAULT true,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(seat_number, area)
);

-- 좌석 인덱스
CREATE INDEX IF NOT EXISTS idx_seats_area ON seats(area);
CREATE INDEX IF NOT EXISTS idx_seats_availability ON seats(is_available);
CREATE INDEX IF NOT EXISTS idx_seats_type ON seats(seat_type);

-- 좌석 업데이트 트리거
CREATE TRIGGER update_seats_updated_at 
    BEFORE UPDATE ON seats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 예약 테이블 생성 (데이터 보존)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'no_show')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- 예약 인덱스
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_seat_id ON reservations(seat_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start_time ON reservations(start_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_date_range ON reservations(start_time, end_time);

-- 예약 업데이트 트리거
CREATE TRIGGER update_reservations_updated_at 
    BEFORE UPDATE ON reservations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 예약 중복 방지 함수
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

-- 예약 중복 방지 트리거
CREATE TRIGGER prevent_overlapping_reservations_trigger
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION prevent_overlapping_reservations();

-- 안전한 예약 생성 함수
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
    
    -- 예약 생성
    INSERT INTO reservations (
        user_id, seat_id, start_time, end_time, notes
    ) VALUES (
        p_user_id, p_seat_id, p_start_time, p_end_time, p_notes
    ) RETURNING id INTO reservation_id;
    
    RETURN reservation_id;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 설정
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 좌석 조회 정책 (모든 사용자가 조회 가능)
CREATE POLICY "Anyone can view seats" ON seats FOR SELECT USING (true);

-- 예약 조회 정책 (사용자는 자신의 예약만 조회)
CREATE POLICY "Users can view own reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id);

-- 예약 생성 정책 (인증된 사용자만 예약 생성 가능)
CREATE POLICY "Authenticated users can create reservations" ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 예약 수정 정책 (사용자는 자신의 예약만 수정)
CREATE POLICY "Users can update own reservations" ON reservations
    FOR UPDATE USING (auth.uid() = user_id);

-- 초기 좌석 데이터 삽입 함수 (데이터 보존)
CREATE OR REPLACE FUNCTION initialize_seats()
RETURNS VOID AS $$
DECLARE
    area_name VARCHAR(20);
    seat_num INTEGER;
BEGIN
    -- 각 구역별로 좌석 생성
    FOR area_name IN SELECT unnest(ARRAY['green', 'pink', 'blue', 'white', 'yellow']) LOOP
        FOR seat_num IN 1..20 LOOP
            -- 좌석이 이미 존재하는지 확인 후 삽입
            INSERT INTO seats (seat_number, area, seat_type, features)
            VALUES (
                seat_num::VARCHAR,
                area_name,
                CASE 
                    WHEN seat_num <= 5 THEN 'premium'
                    WHEN seat_num <= 10 THEN 'standard'
                    ELSE 'standard'
                END,
                CASE 
                    WHEN seat_num <= 5 THEN '{"power_outlet": true, "monitor": true, "privacy_screen": true}'::JSONB
                    WHEN seat_num <= 10 THEN '{"power_outlet": true, "monitor": false}'::JSONB
                    ELSE '{"power_outlet": true}'::JSONB
                END
            )
            ON CONFLICT (seat_number, area) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 초기 데이터 삽입 실행
SELECT initialize_seats();

-- 테이블 코멘트
COMMENT ON TABLE seats IS '스터디카페 좌석 정보 테이블';
COMMENT ON TABLE reservations IS '스터디카페 예약 정보 테이블';
COMMENT ON FUNCTION upsert_user IS '사용자 정보를 안전하게 삽입하거나 업데이트하는 함수';
COMMENT ON FUNCTION create_reservation IS '예약을 안전하게 생성하는 함수';
COMMENT ON FUNCTION initialize_seats IS '초기 좌석 데이터를 안전하게 삽입하는 함수';

-- 예외 처리 및 커밋
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
