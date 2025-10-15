-- 프로그램 테이블 생성
-- 스터디카페에서 제공하는 다양한 프로그램/강의 정보 관리

BEGIN;

-- 프로그램 테이블 생성
CREATE TABLE IF NOT EXISTS programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'study_group', 'exam_prep', 'language', 'certification', 
        'skill_development', 'career_guidance', 'motivation', 'other'
    )),
    program_type VARCHAR(30) NOT NULL CHECK (program_type IN (
        'individual', 'group', 'online', 'offline', 'hybrid'
    )),
    
    -- 프로그램 일정 정보
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
    max_participants INTEGER DEFAULT 1 CHECK (max_participants > 0),
    current_participants INTEGER DEFAULT 0 CHECK (current_participants >= 0),
    
    -- 가격 및 결제 정보
    price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    currency VARCHAR(3) DEFAULT 'KRW',
    payment_type VARCHAR(20) DEFAULT 'one_time' CHECK (payment_type IN (
        'one_time', 'monthly', 'session_based', 'free'
    )),
    
    -- 강사 정보
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    instructor_name VARCHAR(100),
    
    -- 프로그램 상태 및 설정
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'published', 'active', 'completed', 'cancelled', 'suspended'
    )),
    is_featured BOOLEAN DEFAULT false,
    is_online BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    
    -- 프로그램 상세 정보
    prerequisites TEXT,
    learning_objectives TEXT,
    materials_needed TEXT,
    location VARCHAR(200),
    meeting_link VARCHAR(500),
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- 제약 조건
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_participants CHECK (current_participants <= max_participants)
);

-- 프로그램 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);
CREATE INDEX IF NOT EXISTS idx_programs_program_type ON programs(program_type);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_start_date ON programs(start_date);
CREATE INDEX IF NOT EXISTS idx_programs_end_date ON programs(end_date);
CREATE INDEX IF NOT EXISTS idx_programs_instructor_id ON programs(instructor_id);
CREATE INDEX IF NOT EXISTS idx_programs_is_featured ON programs(is_featured);
CREATE INDEX IF NOT EXISTS idx_programs_is_online ON programs(is_online);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON programs(created_at);
CREATE INDEX IF NOT EXISTS idx_programs_date_range ON programs(start_date, end_date);

-- 프로그램 업데이트 트리거
CREATE TRIGGER update_programs_updated_at 
    BEFORE UPDATE ON programs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 프로그램 참여자 테이블 생성
CREATE TABLE IF NOT EXISTS program_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN (
        'enrolled', 'active', 'completed', 'dropped', 'suspended'
    )),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'refunded', 'partial'
    )),
    attendance_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 참여 방지
    UNIQUE(program_id, user_id)
);

-- 프로그램 참여자 인덱스
CREATE INDEX IF NOT EXISTS idx_program_participants_program_id ON program_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_user_id ON program_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_status ON program_participants(status);
CREATE INDEX IF NOT EXISTS idx_program_participants_payment_status ON program_participants(payment_status);
CREATE INDEX IF NOT EXISTS idx_program_participants_enrollment_date ON program_participants(enrollment_date);

-- 프로그램 참여자 업데이트 트리거
CREATE TRIGGER update_program_participants_updated_at 
    BEFORE UPDATE ON program_participants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 프로그램 세션 테이블 생성 (세부 일정 관리)
CREATE TABLE IF NOT EXISTS program_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL CHECK (session_number > 0),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(200),
    meeting_link VARCHAR(500),
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0 CHECK (current_attendees >= 0),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'
    )),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT valid_session_time CHECK (end_time > start_time),
    CONSTRAINT valid_session_attendees CHECK (current_attendees <= COALESCE(max_attendees, 999999)),
    UNIQUE(program_id, session_number)
);

-- 프로그램 세션 인덱스
CREATE INDEX IF NOT EXISTS idx_program_sessions_program_id ON program_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_scheduled_date ON program_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_program_sessions_status ON program_sessions(status);
CREATE INDEX IF NOT EXISTS idx_program_sessions_date_time ON program_sessions(scheduled_date, start_time);

-- 프로그램 세션 업데이트 트리거
CREATE TRIGGER update_program_sessions_updated_at 
    BEFORE UPDATE ON program_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 프로그램 참여자 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_program_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 새 참여자 추가 시
        UPDATE programs 
        SET current_participants = current_participants + 1
        WHERE id = NEW.program_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- 참여자 제거 시
        UPDATE programs 
        SET current_participants = current_participants - 1
        WHERE id = OLD.program_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 프로그램 변경 시
        IF OLD.program_id != NEW.program_id THEN
            UPDATE programs 
            SET current_participants = current_participants - 1
            WHERE id = OLD.program_id;
            UPDATE programs 
            SET current_participants = current_participants + 1
            WHERE id = NEW.program_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 프로그램 참여자 수 업데이트 트리거
CREATE TRIGGER update_program_participant_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON program_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_program_participant_count();

-- 프로그램 참여자 중복 방지 함수
CREATE OR REPLACE FUNCTION prevent_duplicate_program_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- 이미 참여 중인 프로그램인지 확인
    IF EXISTS (
        SELECT 1 FROM program_participants 
        WHERE program_id = NEW.program_id 
        AND user_id = NEW.user_id 
        AND status IN ('enrolled', 'active')
    ) THEN
        RAISE EXCEPTION 'User is already enrolled in this program';
    END IF;
    
    -- 프로그램 정원 초과 확인
    IF EXISTS (
        SELECT 1 FROM programs 
        WHERE id = NEW.program_id 
        AND current_participants >= max_participants
    ) THEN
        RAISE EXCEPTION 'Program is at maximum capacity';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 프로그램 참여자 중복 방지 트리거
CREATE TRIGGER prevent_duplicate_program_enrollment_trigger
    BEFORE INSERT ON program_participants
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_program_enrollment();

-- 안전한 프로그램 생성 함수
CREATE OR REPLACE FUNCTION create_program(
    p_title VARCHAR(200),
    p_description TEXT,
    p_category VARCHAR(50),
    p_program_type VARCHAR(30),
    p_start_date DATE,
    p_end_date DATE,
    p_duration_hours INTEGER,
    p_max_participants INTEGER DEFAULT 1,
    p_price DECIMAL(10,2) DEFAULT 0,
    p_instructor_id UUID DEFAULT NULL,
    p_location VARCHAR(200) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    program_id UUID;
BEGIN
    -- 날짜 유효성 검사
    IF p_end_date < p_start_date THEN
        RAISE EXCEPTION 'End date cannot be before start date';
    END IF;
    
    -- 프로그램 생성
    INSERT INTO programs (
        title, description, category, program_type,
        start_date, end_date, duration_hours, max_participants,
        price, instructor_id, location
    ) VALUES (
        p_title, p_description, p_category, p_program_type,
        p_start_date, p_end_date, p_duration_hours, p_max_participants,
        p_price, p_instructor_id, p_location
    ) RETURNING id INTO program_id;
    
    RETURN program_id;
END;
$$ LANGUAGE plpgsql;

-- 프로그램 참여 함수
CREATE OR REPLACE FUNCTION enroll_in_program(
    p_program_id UUID,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    participant_id UUID;
BEGIN
    -- 프로그램이 존재하고 활성 상태인지 확인
    IF NOT EXISTS (
        SELECT 1 FROM programs 
        WHERE id = p_program_id 
        AND status IN ('published', 'active')
    ) THEN
        RAISE EXCEPTION 'Program is not available for enrollment';
    END IF;
    
    -- 사용자가 활성 상태인지 확인
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User is not active';
    END IF;
    
    -- 참여자 등록
    INSERT INTO program_participants (program_id, user_id)
    VALUES (p_program_id, p_user_id)
    RETURNING id INTO participant_id;
    
    RETURN participant_id;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 설정
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;

-- 프로그램 조회 정책 (공개된 프로그램은 모든 사용자가 조회 가능)
CREATE POLICY "Anyone can view published programs" ON programs
    FOR SELECT USING (status IN ('published', 'active', 'completed'));

-- 프로그램 생성/수정 정책 (강사 또는 관리자만 가능)
CREATE POLICY "Instructors can manage their programs" ON programs
    FOR ALL USING (auth.uid() = instructor_id);

-- 프로그램 참여자 조회 정책 (사용자는 자신의 참여 정보만 조회)
CREATE POLICY "Users can view own program participation" ON program_participants
    FOR SELECT USING (auth.uid() = user_id);

-- 프로그램 참여 정책 (인증된 사용자만 참여 가능)
CREATE POLICY "Authenticated users can enroll in programs" ON program_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 프로그램 세션 조회 정책 (프로그램 참여자만 조회 가능)
CREATE POLICY "Program participants can view sessions" ON program_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM program_participants 
            WHERE program_id = program_sessions.program_id 
            AND user_id = auth.uid()
        )
    );

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE programs IS '스터디카페 프로그램/강의 정보 테이블';
COMMENT ON TABLE program_participants IS '프로그램 참여자 정보 테이블';
COMMENT ON TABLE program_sessions IS '프로그램 세부 세션 정보 테이블';

COMMENT ON COLUMN programs.id IS '프로그램 고유 식별자';
COMMENT ON COLUMN programs.title IS '프로그램 제목';
COMMENT ON COLUMN programs.description IS '프로그램 상세 설명';
COMMENT ON COLUMN programs.category IS '프로그램 카테고리';
COMMENT ON COLUMN programs.program_type IS '프로그램 유형 (개인/그룹/온라인/오프라인/하이브리드)';
COMMENT ON COLUMN programs.start_date IS '프로그램 시작일';
COMMENT ON COLUMN programs.end_date IS '프로그램 종료일';
COMMENT ON COLUMN programs.duration_hours IS '프로그램 총 시간 (시간 단위)';
COMMENT ON COLUMN programs.max_participants IS '최대 참여자 수';
COMMENT ON COLUMN programs.current_participants IS '현재 참여자 수';
COMMENT ON COLUMN programs.price IS '프로그램 가격';
COMMENT ON COLUMN programs.instructor_id IS '강사 사용자 ID';
COMMENT ON COLUMN programs.status IS '프로그램 상태';
COMMENT ON COLUMN programs.is_featured IS '추천 프로그램 여부';
COMMENT ON COLUMN programs.is_online IS '온라인 프로그램 여부';
COMMENT ON COLUMN programs.requires_approval IS '승인 필요 여부';

COMMENT ON COLUMN program_participants.id IS '참여자 등록 고유 식별자';
COMMENT ON COLUMN program_participants.program_id IS '참여한 프로그램 ID';
COMMENT ON COLUMN program_participants.user_id IS '참여자 사용자 ID';
COMMENT ON COLUMN program_participants.enrollment_date IS '등록일';
COMMENT ON COLUMN program_participants.status IS '참여 상태';
COMMENT ON COLUMN program_participants.payment_status IS '결제 상태';
COMMENT ON COLUMN program_participants.attendance_count IS '출석 횟수';
COMMENT ON COLUMN program_participants.completion_rate IS '완료율 (%)';

COMMENT ON COLUMN program_sessions.id IS '세션 고유 식별자';
COMMENT ON COLUMN program_sessions.program_id IS '소속 프로그램 ID';
COMMENT ON COLUMN program_sessions.session_number IS '세션 번호';
COMMENT ON COLUMN program_sessions.title IS '세션 제목';
COMMENT ON COLUMN program_sessions.scheduled_date IS '예정일';
COMMENT ON COLUMN program_sessions.start_time IS '시작 시간';
COMMENT ON COLUMN program_sessions.end_time IS '종료 시간';
COMMENT ON COLUMN program_sessions.status IS '세션 상태';

-- 함수 코멘트
COMMENT ON FUNCTION create_program IS '새로운 프로그램을 안전하게 생성하는 함수';
COMMENT ON FUNCTION enroll_in_program IS '사용자를 프로그램에 안전하게 등록하는 함수';
COMMENT ON FUNCTION update_program_participant_count IS '프로그램 참여자 수를 자동으로 업데이트하는 트리거 함수';
COMMENT ON FUNCTION prevent_duplicate_program_enrollment IS '중복 프로그램 참여를 방지하는 트리거 함수';

-- 마이그레이션 완료
COMMIT;
