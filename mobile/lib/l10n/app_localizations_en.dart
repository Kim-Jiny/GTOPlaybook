// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'GTO Playbook';

  @override
  String get masterYourPokerGame => 'Master Your Poker Game';

  @override
  String get continueWithGoogle => 'Continue with Google';

  @override
  String get continueWithApple => 'Continue with Apple';

  @override
  String get gtoCharts => 'GTO Charts';

  @override
  String get equity => 'Equity';

  @override
  String get myPage => 'My Page';

  @override
  String get retry => 'Retry';

  @override
  String get reload => 'Reload';

  @override
  String get cancel => 'Cancel';

  @override
  String get done => 'Done';

  @override
  String get clear => 'Clear';

  @override
  String get submit => 'Submit';

  @override
  String get loading => 'Loading...';

  @override
  String get buildYourSpot => 'Build Your Spot';

  @override
  String get buildYourSpotDesc =>
      'Set the table size and stack first, then pick your position. The next screen will group detailed charts by real in-game decisions.';

  @override
  String get headsUp => 'Heads-up';

  @override
  String nMax(int count) {
    return '$count-max';
  }

  @override
  String nbbView(int bb) {
    return '${bb}bb view';
  }

  @override
  String nCharts(int count) {
    return '$count charts';
  }

  @override
  String get stepChooseSeat => 'Step 1. Choose your seat';

  @override
  String get myChips => 'My Chips';

  @override
  String nbbEffective(int bb) {
    return '= ${bb}bb effective';
  }

  @override
  String get enterValuesToCalculate => 'Enter values to calculate stack depth';

  @override
  String nPlayers(int count) {
    return '${count}P';
  }

  @override
  String get tableSize => 'Table Size';

  @override
  String get tableSizeDesc =>
      'Choose the table size first. All seats stay visible at once.';

  @override
  String get positionUTG => 'Under the Gun';

  @override
  String get positionUTGPlus1 => 'Under the Gun +1';

  @override
  String get positionUTGPlus2 => 'Under the Gun +2';

  @override
  String get positionMP => 'Middle Position';

  @override
  String get positionHJ => 'Hijack';

  @override
  String get positionCO => 'Cut Off';

  @override
  String get positionBTN => 'Button';

  @override
  String get positionSB => 'Small Blind';

  @override
  String get positionBB => 'Big Blind';

  @override
  String positionPlaybook(String position) {
    return '$position Playbook';
  }

  @override
  String positionStrategyLibrary(String position) {
    return '$position Strategy Library';
  }

  @override
  String get chooseSpotDesc =>
      'Choose the exact spot you want to study. Each section groups similar decisions so detailed charts stay navigable.';

  @override
  String nSections(int count) {
    return '$count sections';
  }

  @override
  String get categoryOpenPot => 'Open Pot';

  @override
  String get categoryIsoRaise => 'Iso Raise vs Limp';

  @override
  String get categoryColdCall => 'Cold Call';

  @override
  String get categorySqueeze => 'Squeeze';

  @override
  String get categoryFacingSqueeze => 'Facing Squeeze';

  @override
  String get categoryLimpedPot => 'Limped Pot';

  @override
  String get categoryFacing3bet => 'Facing a 3-Bet';

  @override
  String get category3betting => '3-Betting';

  @override
  String get categoryDefending => 'Defending';

  @override
  String get categorySBDefense => 'Small Blind Defense';

  @override
  String get categoryFacing4bet => 'Facing a 4-Bet';

  @override
  String get categoryPostflopCbet => 'Postflop C-Bet';

  @override
  String get categorySummaryRFI => 'Unopened pot';

  @override
  String get categorySummaryIsoRaise =>
      'Attack limpers with raise / overlimp / fold';

  @override
  String get categorySummaryColdCall =>
      'Flat open or overcall when squeezing is too thin';

  @override
  String get categorySummarySqueeze => 'Re-attack open plus caller spots';

  @override
  String get categorySummaryFacingSqueeze =>
      'Respond after your open gets called and squeezed';

  @override
  String get categorySummaryLimpedPot =>
      'Punish limp/check spots with raise or take free equity';

  @override
  String get categorySummaryFacing3bet => 'Responding after opening';

  @override
  String get categorySummary3bet => 'Re-raising an opener';

  @override
  String get categorySummaryDefend => 'Calling or mixing from the blinds';

  @override
  String get categorySummarySBDefend => 'Playing from the small blind';

  @override
  String get categorySummaryFacing4bet => 'Continuing vs a 4-bet';

  @override
  String get categorySummaryPostflopCbet => 'Postflop continuation spot';

  @override
  String villain(String position) {
    return 'Villain: $position';
  }

  @override
  String get spot => 'Spot';

  @override
  String get noChartsAvailable => 'No charts available';

  @override
  String get viewMode => 'View Mode';

  @override
  String get simple => 'Simple';

  @override
  String get detailed => 'Detailed';

  @override
  String get primaryActionFirst => 'Primary action first';

  @override
  String get mixedFrequenciesVisible => 'Mixed frequencies visible';

  @override
  String get pocketPair => 'Pocket Pair';

  @override
  String get suited => 'Suited';

  @override
  String get offsuit => 'Offsuit';

  @override
  String get hand => 'Hand';

  @override
  String nCombos(int count) {
    return '$count combos';
  }

  @override
  String get actionPriority => 'Action Priority';

  @override
  String get noData => 'No data';

  @override
  String get noActionFrequencies =>
      'No action frequencies available for this hand.';

  @override
  String get noMix => 'No mix';

  @override
  String get pureStrategy => 'Pure strategy';

  @override
  String get mixedStrategy => 'Mixed Strategy';

  @override
  String nWayMix(int count) {
    return '$count-way mix';
  }

  @override
  String primaryActionDesc(String action) {
    return 'Primary action is $action with a clear frequency advantage.';
  }

  @override
  String studyNotePure(String hand, String action) {
    return '$hand is mostly played as $action in this node. Treat it as a stable default and only deviate if your source chart changes.';
  }

  @override
  String studyNoteMixed(
    String hand,
    String primary,
    String secondary,
    int gap,
  ) {
    return '$hand mixes actions in this node. Start from $primary as the anchor, then study how $secondary enters the strategy. The top-two gap is $gap percentage points.';
  }

  @override
  String get studyNoteEmpty =>
      'No study note is available because this hand does not have action frequencies yet.';

  @override
  String nPercentAction(String action, int percent) {
    return '$action $percent%';
  }

  @override
  String get equityCalculator => 'Equity Calculator';

  @override
  String get board => 'Board';

  @override
  String get addPlayer => 'Add Player';

  @override
  String get calculate => 'Calculate';

  @override
  String nSimulations(String count) {
    return '$count simulations';
  }

  @override
  String get tapToSelectRange => 'Tap to select range';

  @override
  String nHandsPercent(int count, int percent) {
    return '$count hands (~$percent%)';
  }

  @override
  String selectNCards(int max, String plural, int current) {
    return 'Select $max card$plural ($current/$max)';
  }

  @override
  String rangeNHandsPercent(int count, int percent) {
    return 'Range: $count hands (~$percent%)';
  }

  @override
  String get rangePresetTop10 => 'Top 10%';

  @override
  String get rangePresetTop20 => 'Top 20%';

  @override
  String get rangePresetTop30 => 'Top 30%';

  @override
  String get rangePresetPairs => 'Pairs';

  @override
  String get rangePresetBroadways => 'Broadways';

  @override
  String get rangePresetSuitedConnectors => 'SC';

  @override
  String get handAnalyzer => 'Hand Analyzer';

  @override
  String get myHand => 'My Hand';

  @override
  String get analyze => 'Analyze';

  @override
  String get currentHand => 'Current Hand';

  @override
  String get beatingHands => 'Hands That Beat You';

  @override
  String get outs => 'Outs';

  @override
  String nCards(int count) {
    return '$count cards';
  }

  @override
  String totalNCombos(int count) {
    return '$count total combos';
  }

  @override
  String get contactUs => 'Contact Us';

  @override
  String get myInquiries => 'My Inquiries';

  @override
  String get admin => 'Admin';

  @override
  String get signOut => 'Sign Out';

  @override
  String get deleteAccount => 'Delete Account';

  @override
  String get deleteAccountTitle => 'Delete Account';

  @override
  String get deleteAccountMessage =>
      'Are you sure you want to delete your account? This action is permanent and all your data will be removed. This cannot be undone.';

  @override
  String get delete => 'Delete';

  @override
  String get player => 'Player';

  @override
  String get inquiryTitle => 'Title';

  @override
  String get inquiryContent => 'Content';

  @override
  String get pleaseEnterTitle => 'Please enter a title';

  @override
  String get pleaseEnterContent => 'Please enter content';

  @override
  String get inquirySubmitted => 'Inquiry submitted successfully';

  @override
  String get failedToSubmitInquiry => 'Failed to submit inquiry';

  @override
  String get failedToLoadInquiries => 'Failed to load inquiries';

  @override
  String get failedToLoadAdminData => 'Failed to load admin data';

  @override
  String get failedToSendReply => 'Failed to send reply';

  @override
  String get noInquiriesYet => 'No inquiries yet';

  @override
  String get inquiryDetail => 'Inquiry Detail';

  @override
  String get adminReply => 'Admin Reply';

  @override
  String get statusPending => 'Pending';

  @override
  String get statusReplied => 'Replied';

  @override
  String get users => 'Users';

  @override
  String get inquiries => 'Inquiries';

  @override
  String get pending => 'Pending';

  @override
  String get all => 'All';

  @override
  String get replied => 'Replied';

  @override
  String get signupsLast30Days => 'Signups (Last 30 Days)';

  @override
  String get noDataAvailable => 'No data';

  @override
  String get inquiryManagement => 'Inquiry Management';

  @override
  String get noInquiries => 'No inquiries';

  @override
  String get reply => 'Reply';

  @override
  String get sendReply => 'Send Reply';
}
