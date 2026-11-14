// 배포된 GitHub Pages 웹 앱 목록 설정
// - name: GitHub 저장소(repo) 이름과 동일하게 유지
// - description: 방문자가 기능을 한눈에 파악할 수 있는 한 줄 설명
// - thumbnail: 실제 캡처 이미지 경로 (예: 'assets/thumbnails/cr-clan-manager.png', 16:9 비율 권장)
//              비어 있거나 로드에 실패하면 레트로 엔지니어링 기본 플레이스홀더가 자동 표시됩니다.
const PORTAL_APPS = [
  {
    id: 'cr-clan-manager',
    name: 'cr-clan-manager',
    category: 'Game',
    description: '클래시 로얄 클랜전 참여도와 멤버 전적을 한눈에 관리하는 클랜 운영 대시보드',
    thumbnail: '',
    url: 'https://nev630.github.io/cr-clan-manager/',
    repoUrl: 'https://github.com/nev630/cr-clan-manager'
  },
  {
    id: 'pw-generator',
    name: 'pw-generator',
    category: 'Utility',
    description: '길이·문자 조합 옵션을 커스터마이징해 안전한 비밀번호를 즉시 생성하는 보안 유틸리티',
    thumbnail: '',
    url: 'https://nev630.github.io/pw-generator/',
    repoUrl: 'https://github.com/nev630/pw-generator'
  }
];
