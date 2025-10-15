# 배경 음악 기능 가이드 🎵

## 기능 개요

스터디카페 프로그램에 배경 음악 재생 기능이 추가되었습니다.

### 주요 기능

1. **음악 파일 업로드**: 사용자가 직접 음악 파일을 업로드하여 배경 음악으로 사용
2. **재생/일시정지 제어**: 간편한 버튼으로 음악 재생 제어
3. **로컬 스토리지 저장**: 업로드한 음악 정보를 브라우저에 저장
4. **드래그 앤 드롭 지원**: 파일을 드래그하여 쉽게 업로드

## 사용 방법

### 1. 음악 업로드

1. 화면 우측 하단의 **⚙️ 설정 버튼** 클릭
2. 다이얼로그가 열리면 다음 중 하나를 선택:
   - **드래그 앤 드롭**: 음악 파일을 업로드 영역에 드래그
   - **파일 선택 버튼**: 클릭하여 파일 탐색기에서 선택
3. 업로드가 완료되면 토스트 알림 확인

### 2. 음악 재생

1. 우측 하단의 **🔊/🔇 재생 버튼** 클릭
2. 버튼 아이콘:
   - 🔊 (Volume2): 음악 재생 중
   - 🔇 (VolumeX): 음악 일시정지 중

### 3. 음악 삭제

1. 설정 다이얼로그 열기
2. 업로드된 음악 옆 **X 버튼** 클릭
3. 기본 음악으로 복원됨 (`/public/background-music.mp3`)

## 지원 형식

- **파일 형식**: MP3, WAV, OGG, M4A 등 모든 오디오 형식
- **파일 크기**: 최대 50MB
- **드래그 앤 드롭**: 지원

## 기술 스택

### 새로 추가된 파일

```
src/
├── hooks/
│   └── useBackgroundMusic.ts        # 음악 재생 커스텀 훅
├── components/
│   ├── BackgroundMusicPlayer.tsx    # 음악 플레이어 UI
│   └── MusicUploader.tsx            # 파일 업로드 UI
└── lib/
    └── stores/
        └── musicStore.ts            # Zustand 상태 관리
```

### 사용된 기술

- **Zustand**: 전역 상태 관리 (persist 미들웨어)
- **Web Audio API**: 브라우저 네이티브 오디오 재생
- **File API**: 파일 업로드 및 처리
- **shadcn/ui**: Dialog, Button 등 UI 컴포넌트
- **lucide-react**: 아이콘

## 설정 변경

### 볼륨 조절

`src/components/BackgroundMusicPlayer.tsx` 파일에서:

```tsx
const { isPlaying, isLoaded, toggle } = useBackgroundMusic({
  src: musicSrc,
  volume: 0.2,      // 0.0 ~ 1.0 (기본값: 0.2 = 20%)
  loop: true,
  autoPlay: false,
});
```

### 자동 재생 활성화

```tsx
const { isPlaying, isLoaded, toggle } = useBackgroundMusic({
  src: musicSrc,
  volume: 0.2,
  loop: true,
  autoPlay: true,   // true로 변경 (브라우저 정책 주의)
});
```

> ⚠️ **주의**: 대부분의 브라우저는 사용자 상호작용 없이 자동 재생을 차단합니다.

### 기본 음악 파일 변경

`/public/background-music.mp3` 파일을 원하는 음악으로 교체하면 됩니다.

## 무료 배경 음악 소스

- [YouTube Audio Library](https://www.youtube.com/audiolibrary)
- [Incompetech](https://incompetech.com/music/royalty-free/)
- [Bensound](https://www.bensound.com/)
- [Free Music Archive](https://freemusicarchive.org/)
- [Pixabay Music](https://pixabay.com/music/)

## 데이터 저장

업로드한 음악 정보는 브라우저의 **로컬 스토리지**에 저장됩니다:

- **키**: `background-music-storage`
- **저장 내용**: 파일 이름, URL, 타입
- **유효 기간**: 브라우저 캐시를 삭제하기 전까지 유지

## 트러블슈팅

### 음악이 재생되지 않아요

1. 오디오 파일 형식이 지원되는지 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. 파일 크기가 50MB 이하인지 확인
4. 브라우저 음소거가 해제되어 있는지 확인

### 업로드한 음악이 사라졌어요

- 브라우저 캐시/쿠키를 삭제하면 업로드한 음악 정보도 삭제됩니다
- 다시 업로드하거나 기본 음악을 사용하세요

### 자동 재생이 안 돼요

- 브라우저 정책상 사용자 상호작용 없이 자동 재생이 차단됩니다
- 수동으로 재생 버튼을 클릭해주세요

## 향후 개선 사항

- [ ] 볼륨 슬라이더 추가
- [ ] 재생 목록 기능
- [ ] 음악 페이드 인/아웃 효과
- [ ] 음악 진행 바 표시
- [ ] 키보드 단축키 지원


