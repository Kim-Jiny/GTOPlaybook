// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Korean (`ko`).
class AppLocalizationsKo extends AppLocalizations {
  AppLocalizationsKo([String locale = 'ko']) : super(locale);

  @override
  String get appTitle => 'GTO Playbook';

  @override
  String get masterYourPokerGame => '포커 실력을 한 단계 위로';

  @override
  String get continueWithGoogle => 'Google로 계속하기';

  @override
  String get continueWithApple => 'Apple로 계속하기';

  @override
  String get gtoCharts => 'GTO 차트';

  @override
  String get equity => '에퀴티';

  @override
  String get myPage => '마이 페이지';

  @override
  String get retry => '다시 시도';

  @override
  String get reload => '새로고침';

  @override
  String get cancel => '취소';

  @override
  String get done => '완료';

  @override
  String get clear => '초기화';

  @override
  String get submit => '제출';

  @override
  String get loading => '로딩 중...';

  @override
  String get buildYourSpot => '스팟 설정';

  @override
  String get buildYourSpotDesc =>
      '테이블 인원과 스택을 먼저 설정한 뒤 포지션을 선택하세요. 다음 화면에서 실전 상황별로 차트를 확인할 수 있습니다.';

  @override
  String get headsUp => '헤즈업';

  @override
  String nMax(int count) {
    return '$count-max';
  }

  @override
  String nbbView(int bb) {
    return '${bb}bb 기준';
  }

  @override
  String nCharts(int count) {
    return '$count개 차트';
  }

  @override
  String get stepChooseSeat => 'Step 1. 포지션 선택';

  @override
  String get myChips => '보유 칩';

  @override
  String nbbEffective(int bb) {
    return '= ${bb}bb 이펙티브';
  }

  @override
  String get enterValuesToCalculate => '값을 입력하면 스택 깊이를 계산합니다';

  @override
  String nPlayers(int count) {
    return '$count인';
  }

  @override
  String get tableSize => '테이블 인원';

  @override
  String get tableSizeDesc => '테이블 인원을 먼저 선택하세요. 모든 좌석이 한눈에 표시됩니다.';

  @override
  String get positionUTG => '언더 더 건';

  @override
  String get positionUTGPlus1 => '언더 더 건 +1';

  @override
  String get positionUTGPlus2 => '언더 더 건 +2';

  @override
  String get positionMP => '미들 포지션';

  @override
  String get positionHJ => '하이잭';

  @override
  String get positionCO => '컷오프';

  @override
  String get positionBTN => '버튼';

  @override
  String get positionSB => '스몰 블라인드';

  @override
  String get positionBB => '빅 블라인드';

  @override
  String positionPlaybook(String position) {
    return '$position 플레이북';
  }

  @override
  String positionStrategyLibrary(String position) {
    return '$position 전략 라이브러리';
  }

  @override
  String get chooseSpotDesc =>
      '공부할 스팟을 선택하세요. 각 섹션은 유사한 의사결정을 그룹화하여 차트를 쉽게 탐색할 수 있습니다.';

  @override
  String nSections(int count) {
    return '$count개 섹션';
  }

  @override
  String get categoryOpenPot => '오픈팟';

  @override
  String get categoryIsoRaise => '아이소 레이즈 vs 림프';

  @override
  String get categoryColdCall => '콜드콜';

  @override
  String get categorySqueeze => '스퀴즈';

  @override
  String get categoryFacingSqueeze => '스퀴즈 대응';

  @override
  String get categoryLimpedPot => '림프 팟';

  @override
  String get categoryFacing3bet => '3-Bet 대응';

  @override
  String get category3betting => '3-Bet 하기';

  @override
  String get categoryDefending => '디펜드';

  @override
  String get categorySBDefense => 'SB 디펜드';

  @override
  String get categoryFacing4bet => '4-Bet 대응';

  @override
  String get categoryPostflopCbet => '플랍 이후 C-Bet';

  @override
  String get categorySummaryRFI => '오픈되지 않은 팟';

  @override
  String get categorySummaryIsoRaise => '림퍼에게 레이즈 / 오버림프 / 폴드';

  @override
  String get categorySummaryColdCall => '스퀴즈하기 얇을 때 플랫콜 또는 오버콜';

  @override
  String get categorySummarySqueeze => '오픈 + 콜러 스팟을 리어택';

  @override
  String get categorySummaryFacingSqueeze => '내 오픈에 콜 + 스퀴즈가 들어온 상황';

  @override
  String get categorySummaryLimpedPot => '림프/체크 스팟에서 레이즈 또는 프리 에퀴티';

  @override
  String get categorySummaryFacing3bet => '오픈 후 3-Bet에 대응';

  @override
  String get categorySummary3bet => '오프너에게 Re-raise';

  @override
  String get categorySummaryDefend => '블라인드에서 콜 또는 믹스';

  @override
  String get categorySummarySBDefend => '스몰 블라인드에서 플레이';

  @override
  String get categorySummaryFacing4bet => '4-Bet에 대한 대응';

  @override
  String get categorySummaryPostflopCbet => '플랍 이후 컨티뉴에이션 스팟';

  @override
  String villain(String position) {
    return '빌런: $position';
  }

  @override
  String get spot => '스팟';

  @override
  String get noChartsAvailable => '차트가 없습니다';

  @override
  String get viewMode => '보기 모드';

  @override
  String get simple => '심플';

  @override
  String get detailed => '상세';

  @override
  String get primaryActionFirst => '주요 액션 우선';

  @override
  String get mixedFrequenciesVisible => '믹스 빈도 표시';

  @override
  String get pocketPair => '포켓 페어';

  @override
  String get suited => '수티드';

  @override
  String get offsuit => '오프수트';

  @override
  String get hand => '핸드';

  @override
  String nCombos(int count) {
    return '$count개 콤보';
  }

  @override
  String get actionPriority => '액션 우선순위';

  @override
  String get noData => '데이터 없음';

  @override
  String get noActionFrequencies => '이 핸드에 대한 액션 빈도 데이터가 없습니다.';

  @override
  String get noMix => '믹스 없음';

  @override
  String get pureStrategy => '퓨어 전략';

  @override
  String get mixedStrategy => '믹스 전략';

  @override
  String nWayMix(int count) {
    return '$count가지 믹스';
  }

  @override
  String primaryActionDesc(String action) {
    return '주요 액션은 $action이며, 빈도에서 확실한 우위를 가집니다.';
  }

  @override
  String studyNotePure(String hand, String action) {
    return '$hand는 이 노드에서 주로 $action으로 플레이합니다. 안정적인 기본 전략으로 사용하고, 차트가 변경될 때만 조정하세요.';
  }

  @override
  String studyNoteMixed(
    String hand,
    String primary,
    String secondary,
    int gap,
  ) {
    return '$hand는 이 노드에서 액션을 믹스합니다. $primary를 기준으로 시작한 뒤, $secondary가 전략에 어떻게 포함되는지 학습하세요. 상위 두 액션의 차이는 $gap 퍼센트 포인트입니다.';
  }

  @override
  String get studyNoteEmpty => '이 핸드에 액션 빈도 데이터가 아직 없어 학습 노트를 제공할 수 없습니다.';

  @override
  String nPercentAction(String action, int percent) {
    return '$action $percent%';
  }

  @override
  String get equityCalculator => '에퀴티 계산기';

  @override
  String get board => '보드';

  @override
  String get addPlayer => '플레이어 추가';

  @override
  String get calculate => '계산';

  @override
  String nSimulations(String count) {
    return '$count회 시뮬레이션';
  }

  @override
  String get tapToSelectRange => '탭하여 레인지 선택';

  @override
  String nHandsPercent(int count, int percent) {
    return '$count개 핸드 (~$percent%)';
  }

  @override
  String selectNCards(int max, String plural, int current) {
    return '카드 $max장 선택 ($current/$max)';
  }

  @override
  String rangeNHandsPercent(int count, int percent) {
    return '레인지: $count개 핸드 (~$percent%)';
  }

  @override
  String get handAnalyzer => '핸드 분석기';

  @override
  String get myHand => '내 핸드';

  @override
  String get analyze => '분석하기';

  @override
  String get currentHand => '현재 핸드';

  @override
  String get beatingHands => '나를 이기는 핸드';

  @override
  String get outs => '아웃츠';

  @override
  String nCards(int count) {
    return '$count장';
  }

  @override
  String totalNCombos(int count) {
    return '총 $count개 콤보';
  }

  @override
  String get contactUs => '문의하기';

  @override
  String get myInquiries => '내 문의 내역';

  @override
  String get admin => '관리자';

  @override
  String get signOut => '로그아웃';

  @override
  String get player => '플레이어';

  @override
  String get inquiryTitle => '제목';

  @override
  String get inquiryContent => '내용';

  @override
  String get pleaseEnterTitle => '제목을 입력해주세요';

  @override
  String get pleaseEnterContent => '내용을 입력해주세요';

  @override
  String get inquirySubmitted => '문의가 성공적으로 제출되었습니다';

  @override
  String get failedToSubmitInquiry => '문의 제출에 실패했습니다';

  @override
  String get noInquiriesYet => '문의 내역이 없습니다';

  @override
  String get inquiryDetail => '문의 상세';

  @override
  String get adminReply => '관리자 답변';

  @override
  String get statusPending => '대기 중';

  @override
  String get statusReplied => '답변 완료';

  @override
  String get users => '사용자';

  @override
  String get inquiries => '문의';

  @override
  String get pending => '대기 중';

  @override
  String get all => '전체';

  @override
  String get replied => '답변 완료';

  @override
  String get signupsLast30Days => '가입자 수 (최근 30일)';

  @override
  String get noDataAvailable => '데이터 없음';

  @override
  String get inquiryManagement => '문의 관리';

  @override
  String get noInquiries => '문의가 없습니다';

  @override
  String get reply => '답변';

  @override
  String get sendReply => '답변 보내기';
}
