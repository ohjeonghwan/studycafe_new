-- 샘플 프로그램 데이터 삽입
-- 스터디카페에서 제공할 다양한 프로그램들의 예시 데이터

BEGIN;

-- 샘플 프로그램 데이터 삽입
INSERT INTO programs (
    title, description, category, program_type,
    start_date, end_date, duration_hours, max_participants,
    price, instructor_name, status, is_featured, is_online,
    prerequisites, learning_objectives, materials_needed, location
) VALUES 
-- 스터디 그룹 프로그램들
(
    '토익 900점 목표 스터디 그룹',
    '체계적인 토익 공부 방법과 함께 목표 점수 달성을 위한 그룹 스터디입니다. 매주 모의고사와 함께 실전 감각을 기릅니다.',
    'study_group',
    'group',
    '2024-01-15',
    '2024-04-15',
    48,
    8,
    150000,
    '김영희',
    'published',
    true,
    false,
    '토익 기본기 보유자 (700점 이상)',
    '토익 900점 달성, 체계적인 영어 학습법 습득',
    '토익 교재, 노트, 필기구',
    '예닮 스터디카페 2층 그룹 스터디룸'
),
(
    '공무원 시험 준비 스터디',
    '9급 공무원 시험을 준비하는 분들을 위한 체계적인 스터디 그룹입니다. 기출문제 분석과 함께 효율적인 학습법을 공유합니다.',
    'exam_prep',
    'group',
    '2024-02-01',
    '2024-07-31',
    120,
    12,
    200000,
    '박민수',
    'published',
    true,
    false,
    '공무원 시험 준비생',
    '공무원 시험 합격, 체계적인 학습 계획 수립',
    '공무원 교재, 기출문제집, 노트',
    '예닮 스터디카페 3층 대형 스터디룸'
),
(
    '일본어 JLPT N2 준비반',
    '일본어 능력시험 N2 합격을 목표로 하는 프로그램입니다. 문법, 어휘, 독해를 종합적으로 학습합니다.',
    'language',
    'group',
    '2024-01-20',
    '2024-06-20',
    60,
    10,
    180000,
    '이지은',
    'published',
    false,
    true,
    'JLPT N3 수준 이상',
    'JLPT N2 합격, 실용적인 일본어 실력 향상',
    'JLPT N2 교재, 단어장, 노트',
    '온라인 (Zoom)'
),
(
    '컴퓨터활용능력 1급 자격증 준비',
    '컴퓨터활용능력 1급 자격증 취득을 위한 실무 중심의 프로그램입니다. 엑셀과 액세스를 활용한 실무 능력을 기릅니다.',
    'certification',
    'group',
    '2024-02-10',
    '2024-05-10',
    40,
    15,
    120000,
    '최현우',
    'published',
    false,
    false,
    '컴퓨터 기본 사용법 숙지',
    '컴퓨터활용능력 1급 자격증 취득',
    '컴퓨터활용능력 교재, 실습용 노트북',
    '예닮 스터디카페 1층 컴퓨터실'
),
(
    '파이썬 프로그래밍 기초',
    '프로그래밍 입문자를 위한 파이썬 기초 과정입니다. 프로그래밍의 기본 개념부터 실무에 활용할 수 있는 수준까지 학습합니다.',
    'skill_development',
    'hybrid',
    '2024-01-25',
    '2024-04-25',
    32,
    20,
    100000,
    '정수민',
    'published',
    true,
    true,
    '프로그래밍 경험 없음 (입문자 환영)',
    '파이썬 기초 문법 숙지, 간단한 프로그램 작성 가능',
    '노트북, 파이썬 교재',
    '온라인 + 오프라인 병행'
),
(
    '취업 준비 및 면접 스킬 향상',
    '취업 준비생들을 위한 체계적인 취업 준비 프로그램입니다. 이력서 작성부터 면접 스킬까지 종합적으로 준비합니다.',
    'career_guidance',
    'group',
    '2024-02-15',
    '2024-05-15',
    24,
    8,
    80000,
    '한미영',
    'published',
    false,
    false,
    '취업 준비생',
    '효과적인 이력서 작성, 면접 스킬 향상',
    '이력서 양식, 포트폴리오',
    '예닮 스터디카페 2층 상담실'
),
(
    '학습 동기 부여 및 목표 설정',
    '학습에 대한 동기를 높이고 효과적인 목표 설정 방법을 배우는 프로그램입니다. 개인의 학습 스타일을 파악하고 최적화된 학습법을 찾습니다.',
    'motivation',
    'individual',
    '2024-02-01',
    '2024-03-01',
    8,
    1,
    50000,
    '김동욱',
    'published',
    false,
    true,
    '학습 동기 부여가 필요한 모든 분',
    '개인 맞춤형 학습 계획 수립, 학습 동기 향상',
    '학습 계획표, 목표 설정 워크북',
    '온라인 (Zoom)'
),
(
    '영어 회화 스터디 그룹',
    '실제 영어 회화 실력 향상을 위한 그룹 스터디입니다. 다양한 주제로 자유롭게 대화하며 영어 실력을 기릅니다.',
    'language',
    'group',
    '2024-01-30',
    '2024-06-30',
    40,
    6,
    120000,
    'Sarah Johnson',
    'published',
    true,
    false,
    '영어 기초 회화 가능',
    '자연스러운 영어 회화 능력 향상',
    '영어 회화 교재, 노트',
    '예닮 스터디카페 1층 회화실'
),
(
    '정보처리기사 자격증 준비반',
    '정보처리기사 자격증 취득을 위한 체계적인 학습 프로그램입니다. 이론과 실기를 병행하여 효율적으로 준비합니다.',
    'certification',
    'group',
    '2024-03-01',
    '2024-08-31',
    80,
    12,
    180000,
    '이준호',
    'published',
    false,
    true,
    '컴퓨터 관련 기초 지식',
    '정보처리기사 자격증 취득',
    '정보처리기사 교재, 실습용 PC',
    '온라인 (Zoom)'
),
(
    '스마트폰 활용 및 디지털 리터러시',
    '중장년층을 위한 스마트폰 활용법과 디지털 기기 사용법을 배우는 프로그램입니다. 일상생활에 필요한 디지털 기술을 익힙니다.',
    'skill_development',
    'group',
    '2024-02-20',
    '2024-04-20',
    20,
    15,
    60000,
    '박지영',
    'published',
    false,
    false,
    '스마트폰 사용 경험자',
    '스마트폰 활용 능력 향상, 디지털 격차 해소',
    '스마트폰, 노트',
    '예닮 스터디카페 1층 교육실'
);

-- 프로그램 세션 데이터 추가 (토익 스터디 그룹 예시)
INSERT INTO program_sessions (program_id, session_number, title, description, scheduled_date, start_time, end_time, location, status)
SELECT 
    p.id,
    generate_series(1, 12) as session_number,
    '토익 모의고사 및 해설 ' || generate_series(1, 12),
    '토익 실전 모의고사 풀이 및 상세 해설',
    '2024-01-15'::date + (generate_series(1, 12) * interval '1 week'),
    '10:00'::time,
    '12:00'::time,
    '예닮 스터디카페 2층 그룹 스터디룸',
    'scheduled'
FROM programs p
WHERE p.title = '토익 900점 목표 스터디 그룹';

-- 프로그램 세션 데이터 추가 (공무원 시험 준비 스터디 예시)
INSERT INTO program_sessions (program_id, session_number, title, description, scheduled_date, start_time, end_time, location, status)
SELECT 
    p.id,
    generate_series(1, 24) as session_number,
    '공무원 기출문제 분석 ' || generate_series(1, 24),
    '과목별 기출문제 분석 및 해설',
    '2024-02-01'::date + (generate_series(1, 24) * interval '1 week'),
    '14:00'::time,
    '16:00'::time,
    '예닮 스터디카페 3층 대형 스터디룸',
    'scheduled'
FROM programs p
WHERE p.title = '공무원 시험 준비 스터디';

COMMIT;



















