import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ko.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ko'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'GTO Playbook'**
  String get appTitle;

  /// No description provided for @masterYourPokerGame.
  ///
  /// In en, this message translates to:
  /// **'Master Your Poker Game'**
  String get masterYourPokerGame;

  /// No description provided for @continueWithGoogle.
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueWithGoogle;

  /// No description provided for @continueWithApple.
  ///
  /// In en, this message translates to:
  /// **'Continue with Apple'**
  String get continueWithApple;

  /// No description provided for @gtoCharts.
  ///
  /// In en, this message translates to:
  /// **'GTO Charts'**
  String get gtoCharts;

  /// No description provided for @equity.
  ///
  /// In en, this message translates to:
  /// **'Equity'**
  String get equity;

  /// No description provided for @myPage.
  ///
  /// In en, this message translates to:
  /// **'My Page'**
  String get myPage;

  /// No description provided for @themeLabel.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get themeLabel;

  /// No description provided for @themeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get themeSystem;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// No description provided for @removeAds.
  ///
  /// In en, this message translates to:
  /// **'Remove Ads'**
  String get removeAds;

  /// No description provided for @removeAdsDesc.
  ///
  /// In en, this message translates to:
  /// **'One-time purchase. Removes all ads for good.'**
  String get removeAdsDesc;

  /// No description provided for @adsRemoved.
  ///
  /// In en, this message translates to:
  /// **'Ads removed'**
  String get adsRemoved;

  /// No description provided for @restorePurchases.
  ///
  /// In en, this message translates to:
  /// **'Restore purchases'**
  String get restorePurchases;

  /// No description provided for @purchaseSuccess.
  ///
  /// In en, this message translates to:
  /// **'Thank you! Ads have been removed.'**
  String get purchaseSuccess;

  /// No description provided for @purchaseRestoreEmpty.
  ///
  /// In en, this message translates to:
  /// **'No purchases to restore.'**
  String get purchaseRestoreEmpty;

  /// No description provided for @purchasePending.
  ///
  /// In en, this message translates to:
  /// **'Your purchase is pending approval.'**
  String get purchasePending;

  /// No description provided for @purchaseFailed.
  ///
  /// In en, this message translates to:
  /// **'The purchase could not be completed. Please try again.'**
  String get purchaseFailed;

  /// No description provided for @purchaseNoticeShort.
  ///
  /// In en, this message translates to:
  /// **'This is a digital item that takes effect as soon as you buy it. Withdrawal may be limited once it has been applied.'**
  String get purchaseNoticeShort;

  /// No description provided for @purchaseInfoLink.
  ///
  /// In en, this message translates to:
  /// **'Purchase & refund info'**
  String get purchaseInfoLink;

  /// No description provided for @purchasePolicyEffective.
  ///
  /// In en, this message translates to:
  /// **'Effective: October 13, 2026'**
  String get purchasePolicyEffective;

  /// No description provided for @purchasePolicyProductTitle.
  ///
  /// In en, this message translates to:
  /// **'Item for sale'**
  String get purchasePolicyProductTitle;

  /// No description provided for @purchasePolicyProductBody.
  ///
  /// In en, this message translates to:
  /// **'Remove Ads: removes all banner and interstitial ads in the app. One-time payment, permanent. It is not a subscription.\n\nCharts, the equity calculator, the pot calculator and every other feature work the same whether or not you buy it.\n\nThe price is shown on the purchase screen and in the store listing (App Store, Google Play).'**
  String get purchasePolicyProductBody;

  /// No description provided for @purchasePolicyPaymentTitle.
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get purchasePolicyPaymentTitle;

  /// No description provided for @purchasePolicyPaymentBody.
  ///
  /// In en, this message translates to:
  /// **'Payment is processed by the Apple App Store or Google Play. We do not store card numbers or other payment details.\n\nYour purchase is confirmed on our server by checking the store receipt, and is saved against the account you are signed in with.'**
  String get purchasePolicyPaymentBody;

  /// No description provided for @purchasePolicyUsageTitle.
  ///
  /// In en, this message translates to:
  /// **'Use and restore'**
  String get purchasePolicyUsageTitle;

  /// No description provided for @purchasePolicyUsageBody.
  ///
  /// In en, this message translates to:
  /// **'A purchase is linked to the account you were signed in with when you bought it.\n\nAfter switching devices or reinstalling the app, sign in with the same account and tap \"Restore purchases\" on My Page.\n\nOne purchase can be linked to one account only. A purchase already linked to another account cannot be used on a different one.\n\nIf you delete your account, the purchase link stored on our server is deleted. Your store purchase history remains, so you can sign up again with the same store account and use \"Restore purchases\".'**
  String get purchasePolicyUsageBody;

  /// No description provided for @purchasePolicyRefundTitle.
  ///
  /// In en, this message translates to:
  /// **'Withdrawal and refunds'**
  String get purchasePolicyRefundTitle;

  /// No description provided for @purchasePolicyRefundBody.
  ///
  /// In en, this message translates to:
  /// **'Remove Ads is a digital item that takes effect as soon as you buy it. Once it has been applied, withdrawal may be limited to the extent the applicable law (the Act on the Consumer Protection in Electronic Commerce) allows. We tell you this before you buy.\n\nPlease request refunds from the store you bought from (Apple or Google), following its process and policy. Payments and refunds are handled by the store, so we cannot refund you directly.\n• Apple: use \"Report a Problem\" in your purchase history\n• Google Play: request a refund from your order history in the Play Store\n\nWhen a refund is completed, the app notices it the next time it loads your purchase status and switches ad removal off. This can take some time.\n\nIf something is wrong, for example ads do not go away after you bought it, please contact us below.'**
  String get purchasePolicyRefundBody;

  /// No description provided for @purchasePolicyContactTitle.
  ///
  /// In en, this message translates to:
  /// **'Business information & contact'**
  String get purchasePolicyContactTitle;

  /// No description provided for @purchasePolicyContactBody.
  ///
  /// In en, this message translates to:
  /// **'Business name: Jinsoft\nRepresentative: Kim Mijin\nAddress: 138 Chunggyeong-ro, Building 303, Unit 508, Deogyang-gu, Gyeonggi-do\nPhone: 010-4676-2773\nBusiness registration no.: 827-53-01093\nMail-order business report no.: 2026-고양덕양구-0658\nEmail: kjinyz@naver.com\nIn the app: My Page > Contact us'**
  String get purchasePolicyContactBody;

  /// No description provided for @privacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// No description provided for @termsOfService.
  ///
  /// In en, this message translates to:
  /// **'Terms of Service'**
  String get termsOfService;

  /// No description provided for @viewOnWeb.
  ///
  /// In en, this message translates to:
  /// **'View on the web'**
  String get viewOnWeb;

  /// No description provided for @linkOpenFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t open the link. Please try again later.'**
  String get linkOpenFailed;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @reload.
  ///
  /// In en, this message translates to:
  /// **'Reload'**
  String get reload;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @done.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get done;

  /// No description provided for @clear.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get clear;

  /// No description provided for @submit.
  ///
  /// In en, this message translates to:
  /// **'Submit'**
  String get submit;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading...'**
  String get loading;

  /// No description provided for @buildYourSpot.
  ///
  /// In en, this message translates to:
  /// **'Build Your Spot'**
  String get buildYourSpot;

  /// No description provided for @buildYourSpotDesc.
  ///
  /// In en, this message translates to:
  /// **'Set the table size and stack first, then pick your position. The next screen will group detailed charts by real in-game decisions.'**
  String get buildYourSpotDesc;

  /// No description provided for @headsUp.
  ///
  /// In en, this message translates to:
  /// **'Heads-up'**
  String get headsUp;

  /// No description provided for @nMax.
  ///
  /// In en, this message translates to:
  /// **'{count}-max'**
  String nMax(int count);

  /// No description provided for @nbbView.
  ///
  /// In en, this message translates to:
  /// **'{bb}bb view'**
  String nbbView(int bb);

  /// No description provided for @nCharts.
  ///
  /// In en, this message translates to:
  /// **'{count} charts'**
  String nCharts(int count);

  /// No description provided for @stepChooseSeat.
  ///
  /// In en, this message translates to:
  /// **'Step 1. Choose your seat'**
  String get stepChooseSeat;

  /// No description provided for @myChips.
  ///
  /// In en, this message translates to:
  /// **'My Chips'**
  String get myChips;

  /// No description provided for @nbbEffective.
  ///
  /// In en, this message translates to:
  /// **'= {bb}bb effective'**
  String nbbEffective(int bb);

  /// No description provided for @enterValuesToCalculate.
  ///
  /// In en, this message translates to:
  /// **'Enter values to calculate stack depth'**
  String get enterValuesToCalculate;

  /// No description provided for @nPlayers.
  ///
  /// In en, this message translates to:
  /// **'{count}P'**
  String nPlayers(int count);

  /// No description provided for @tableSize.
  ///
  /// In en, this message translates to:
  /// **'Table Size'**
  String get tableSize;

  /// No description provided for @tableSizeDesc.
  ///
  /// In en, this message translates to:
  /// **'Choose the table size first. All seats stay visible at once.'**
  String get tableSizeDesc;

  /// No description provided for @positionUTG.
  ///
  /// In en, this message translates to:
  /// **'Under the Gun'**
  String get positionUTG;

  /// No description provided for @positionUTGPlus1.
  ///
  /// In en, this message translates to:
  /// **'Under the Gun +1'**
  String get positionUTGPlus1;

  /// No description provided for @positionUTGPlus2.
  ///
  /// In en, this message translates to:
  /// **'Under the Gun +2'**
  String get positionUTGPlus2;

  /// No description provided for @positionMP.
  ///
  /// In en, this message translates to:
  /// **'Middle Position'**
  String get positionMP;

  /// No description provided for @positionHJ.
  ///
  /// In en, this message translates to:
  /// **'Hijack'**
  String get positionHJ;

  /// No description provided for @positionCO.
  ///
  /// In en, this message translates to:
  /// **'Cut Off'**
  String get positionCO;

  /// No description provided for @positionBTN.
  ///
  /// In en, this message translates to:
  /// **'Button'**
  String get positionBTN;

  /// No description provided for @positionSB.
  ///
  /// In en, this message translates to:
  /// **'Small Blind'**
  String get positionSB;

  /// No description provided for @positionBB.
  ///
  /// In en, this message translates to:
  /// **'Big Blind'**
  String get positionBB;

  /// No description provided for @positionPlaybook.
  ///
  /// In en, this message translates to:
  /// **'{position} Playbook'**
  String positionPlaybook(String position);

  /// No description provided for @positionStrategyLibrary.
  ///
  /// In en, this message translates to:
  /// **'{position} Strategy Library'**
  String positionStrategyLibrary(String position);

  /// No description provided for @chooseSpotDesc.
  ///
  /// In en, this message translates to:
  /// **'Choose the exact spot you want to study. Each section groups similar decisions so detailed charts stay navigable.'**
  String get chooseSpotDesc;

  /// No description provided for @nSections.
  ///
  /// In en, this message translates to:
  /// **'{count} sections'**
  String nSections(int count);

  /// No description provided for @categoryOpenPot.
  ///
  /// In en, this message translates to:
  /// **'Open Raise'**
  String get categoryOpenPot;

  /// No description provided for @categoryIsoRaise.
  ///
  /// In en, this message translates to:
  /// **'Iso Raise vs Limp'**
  String get categoryIsoRaise;

  /// No description provided for @categoryColdCall.
  ///
  /// In en, this message translates to:
  /// **'Cold Call'**
  String get categoryColdCall;

  /// No description provided for @categorySqueeze.
  ///
  /// In en, this message translates to:
  /// **'Squeeze'**
  String get categorySqueeze;

  /// No description provided for @categoryFacingSqueeze.
  ///
  /// In en, this message translates to:
  /// **'Facing Squeeze'**
  String get categoryFacingSqueeze;

  /// No description provided for @categoryLimpedPot.
  ///
  /// In en, this message translates to:
  /// **'Limped Pot'**
  String get categoryLimpedPot;

  /// No description provided for @categoryFacing3bet.
  ///
  /// In en, this message translates to:
  /// **'Facing a 3-Bet'**
  String get categoryFacing3bet;

  /// No description provided for @category3betting.
  ///
  /// In en, this message translates to:
  /// **'3-Betting'**
  String get category3betting;

  /// No description provided for @categoryDefending.
  ///
  /// In en, this message translates to:
  /// **'Defending'**
  String get categoryDefending;

  /// No description provided for @categorySBDefense.
  ///
  /// In en, this message translates to:
  /// **'Small Blind Defense'**
  String get categorySBDefense;

  /// No description provided for @categoryFacing4bet.
  ///
  /// In en, this message translates to:
  /// **'Facing a 4-Bet'**
  String get categoryFacing4bet;

  /// No description provided for @categoryPostflopCbet.
  ///
  /// In en, this message translates to:
  /// **'Postflop C-Bet'**
  String get categoryPostflopCbet;

  /// No description provided for @categorySummaryRFI.
  ///
  /// In en, this message translates to:
  /// **'Unopened pot'**
  String get categorySummaryRFI;

  /// No description provided for @categorySummaryIsoRaise.
  ///
  /// In en, this message translates to:
  /// **'Attack limpers with raise / overlimp / fold'**
  String get categorySummaryIsoRaise;

  /// No description provided for @categorySummaryColdCall.
  ///
  /// In en, this message translates to:
  /// **'Flat open or overcall when squeezing is too thin'**
  String get categorySummaryColdCall;

  /// No description provided for @categorySummarySqueeze.
  ///
  /// In en, this message translates to:
  /// **'Re-attack open plus caller spots'**
  String get categorySummarySqueeze;

  /// No description provided for @categorySummaryFacingSqueeze.
  ///
  /// In en, this message translates to:
  /// **'Respond after your open gets called and squeezed'**
  String get categorySummaryFacingSqueeze;

  /// No description provided for @categorySummaryLimpedPot.
  ///
  /// In en, this message translates to:
  /// **'Punish limp/check spots with raise or take free equity'**
  String get categorySummaryLimpedPot;

  /// No description provided for @categorySummaryFacing3bet.
  ///
  /// In en, this message translates to:
  /// **'Responding after opening'**
  String get categorySummaryFacing3bet;

  /// No description provided for @categorySummary3bet.
  ///
  /// In en, this message translates to:
  /// **'Re-raising an opener'**
  String get categorySummary3bet;

  /// No description provided for @categorySummaryDefend.
  ///
  /// In en, this message translates to:
  /// **'Calling or mixing from the blinds'**
  String get categorySummaryDefend;

  /// No description provided for @categorySummarySBDefend.
  ///
  /// In en, this message translates to:
  /// **'Playing from the small blind'**
  String get categorySummarySBDefend;

  /// No description provided for @categorySummaryFacing4bet.
  ///
  /// In en, this message translates to:
  /// **'Continuing vs a 4-bet'**
  String get categorySummaryFacing4bet;

  /// No description provided for @categorySummaryPostflopCbet.
  ///
  /// In en, this message translates to:
  /// **'Postflop continuation spot'**
  String get categorySummaryPostflopCbet;

  /// No description provided for @villain.
  ///
  /// In en, this message translates to:
  /// **'Villain: {position}'**
  String villain(String position);

  /// No description provided for @spot.
  ///
  /// In en, this message translates to:
  /// **'Spot'**
  String get spot;

  /// No description provided for @noChartsAvailable.
  ///
  /// In en, this message translates to:
  /// **'No charts available'**
  String get noChartsAvailable;

  /// No description provided for @stackLabel.
  ///
  /// In en, this message translates to:
  /// **'Stack'**
  String get stackLabel;

  /// No description provided for @noChartForStack.
  ///
  /// In en, this message translates to:
  /// **'No chart for {stack}bb at this spot'**
  String noChartForStack(int stack);

  /// No description provided for @viewMode.
  ///
  /// In en, this message translates to:
  /// **'View Mode'**
  String get viewMode;

  /// No description provided for @simple.
  ///
  /// In en, this message translates to:
  /// **'Simple'**
  String get simple;

  /// No description provided for @detailed.
  ///
  /// In en, this message translates to:
  /// **'Detailed'**
  String get detailed;

  /// No description provided for @primaryActionFirst.
  ///
  /// In en, this message translates to:
  /// **'Primary action first'**
  String get primaryActionFirst;

  /// No description provided for @mixedFrequenciesVisible.
  ///
  /// In en, this message translates to:
  /// **'Mixed frequencies visible'**
  String get mixedFrequenciesVisible;

  /// No description provided for @pocketPair.
  ///
  /// In en, this message translates to:
  /// **'Pocket Pair'**
  String get pocketPair;

  /// No description provided for @suited.
  ///
  /// In en, this message translates to:
  /// **'Suited'**
  String get suited;

  /// No description provided for @offsuit.
  ///
  /// In en, this message translates to:
  /// **'Offsuit'**
  String get offsuit;

  /// No description provided for @hand.
  ///
  /// In en, this message translates to:
  /// **'Hand'**
  String get hand;

  /// No description provided for @nCombos.
  ///
  /// In en, this message translates to:
  /// **'{count} combos'**
  String nCombos(int count);

  /// No description provided for @actionPriority.
  ///
  /// In en, this message translates to:
  /// **'Action Priority'**
  String get actionPriority;

  /// No description provided for @noData.
  ///
  /// In en, this message translates to:
  /// **'No data'**
  String get noData;

  /// No description provided for @noActionFrequencies.
  ///
  /// In en, this message translates to:
  /// **'No action frequencies available for this hand.'**
  String get noActionFrequencies;

  /// No description provided for @noMix.
  ///
  /// In en, this message translates to:
  /// **'No mix'**
  String get noMix;

  /// No description provided for @pureStrategy.
  ///
  /// In en, this message translates to:
  /// **'Pure strategy'**
  String get pureStrategy;

  /// No description provided for @mixedStrategy.
  ///
  /// In en, this message translates to:
  /// **'Mixed Strategy'**
  String get mixedStrategy;

  /// No description provided for @nWayMix.
  ///
  /// In en, this message translates to:
  /// **'{count}-way mix'**
  String nWayMix(int count);

  /// No description provided for @primaryActionDesc.
  ///
  /// In en, this message translates to:
  /// **'Primary action is {action} with a clear frequency advantage.'**
  String primaryActionDesc(String action);

  /// No description provided for @studyNotePure.
  ///
  /// In en, this message translates to:
  /// **'{hand} is mostly played as {action} in this node. Treat it as a stable default and only deviate if your source chart changes.'**
  String studyNotePure(String hand, String action);

  /// No description provided for @studyNoteMixed.
  ///
  /// In en, this message translates to:
  /// **'{hand} mixes actions in this node. Start from {primary} as the anchor, then study how {secondary} enters the strategy. The top-two gap is {gap} percentage points.'**
  String studyNoteMixed(String hand, String primary, String secondary, int gap);

  /// No description provided for @studyNoteEmpty.
  ///
  /// In en, this message translates to:
  /// **'No study note is available because this hand does not have action frequencies yet.'**
  String get studyNoteEmpty;

  /// No description provided for @nPercentAction.
  ///
  /// In en, this message translates to:
  /// **'{action} {percent}%'**
  String nPercentAction(String action, int percent);

  /// No description provided for @equityCalculator.
  ///
  /// In en, this message translates to:
  /// **'Equity Calculator'**
  String get equityCalculator;

  /// No description provided for @board.
  ///
  /// In en, this message translates to:
  /// **'Board'**
  String get board;

  /// No description provided for @addPlayer.
  ///
  /// In en, this message translates to:
  /// **'Add Player'**
  String get addPlayer;

  /// No description provided for @calculate.
  ///
  /// In en, this message translates to:
  /// **'Calculate'**
  String get calculate;

  /// No description provided for @nSimulations.
  ///
  /// In en, this message translates to:
  /// **'{count} simulations'**
  String nSimulations(String count);

  /// No description provided for @tapToSelectRange.
  ///
  /// In en, this message translates to:
  /// **'Tap to select range'**
  String get tapToSelectRange;

  /// No description provided for @nHandsPercent.
  ///
  /// In en, this message translates to:
  /// **'{count} hands (~{percent}%)'**
  String nHandsPercent(int count, int percent);

  /// No description provided for @selectNCards.
  ///
  /// In en, this message translates to:
  /// **'Select {max} card{plural} ({current}/{max})'**
  String selectNCards(int max, String plural, int current);

  /// No description provided for @rangeNHandsPercent.
  ///
  /// In en, this message translates to:
  /// **'Range: {count} hands (~{percent}%)'**
  String rangeNHandsPercent(int count, int percent);

  /// No description provided for @rangePresetTop10.
  ///
  /// In en, this message translates to:
  /// **'Top 10%'**
  String get rangePresetTop10;

  /// No description provided for @rangePresetTop20.
  ///
  /// In en, this message translates to:
  /// **'Top 20%'**
  String get rangePresetTop20;

  /// No description provided for @rangePresetTop30.
  ///
  /// In en, this message translates to:
  /// **'Top 30%'**
  String get rangePresetTop30;

  /// No description provided for @rangePresetPairs.
  ///
  /// In en, this message translates to:
  /// **'Pairs'**
  String get rangePresetPairs;

  /// No description provided for @rangePresetBroadways.
  ///
  /// In en, this message translates to:
  /// **'Broadways'**
  String get rangePresetBroadways;

  /// No description provided for @rangePresetSuitedConnectors.
  ///
  /// In en, this message translates to:
  /// **'SC'**
  String get rangePresetSuitedConnectors;

  /// No description provided for @handAnalyzer.
  ///
  /// In en, this message translates to:
  /// **'Hand Analyzer'**
  String get handAnalyzer;

  /// No description provided for @myHand.
  ///
  /// In en, this message translates to:
  /// **'My Hand'**
  String get myHand;

  /// No description provided for @analyze.
  ///
  /// In en, this message translates to:
  /// **'Analyze'**
  String get analyze;

  /// No description provided for @currentHand.
  ///
  /// In en, this message translates to:
  /// **'Current Hand'**
  String get currentHand;

  /// No description provided for @beatingHands.
  ///
  /// In en, this message translates to:
  /// **'Hands That Beat You'**
  String get beatingHands;

  /// No description provided for @outs.
  ///
  /// In en, this message translates to:
  /// **'Outs'**
  String get outs;

  /// No description provided for @nCards.
  ///
  /// In en, this message translates to:
  /// **'{count} cards'**
  String nCards(int count);

  /// No description provided for @totalNCombos.
  ///
  /// In en, this message translates to:
  /// **'{count} total combos'**
  String totalNCombos(int count);

  /// No description provided for @contactUs.
  ///
  /// In en, this message translates to:
  /// **'Contact Us'**
  String get contactUs;

  /// No description provided for @myInquiries.
  ///
  /// In en, this message translates to:
  /// **'My Inquiries'**
  String get myInquiries;

  /// No description provided for @admin.
  ///
  /// In en, this message translates to:
  /// **'Admin'**
  String get admin;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign Out'**
  String get signOut;

  /// No description provided for @deleteAccount.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get deleteAccount;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountMessage.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete your account? This action is permanent and all your data will be removed. This cannot be undone.'**
  String get deleteAccountMessage;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @player.
  ///
  /// In en, this message translates to:
  /// **'Player'**
  String get player;

  /// No description provided for @inquiryTitle.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get inquiryTitle;

  /// No description provided for @inquiryContent.
  ///
  /// In en, this message translates to:
  /// **'Content'**
  String get inquiryContent;

  /// No description provided for @pleaseEnterTitle.
  ///
  /// In en, this message translates to:
  /// **'Please enter a title'**
  String get pleaseEnterTitle;

  /// No description provided for @pleaseEnterContent.
  ///
  /// In en, this message translates to:
  /// **'Please enter content'**
  String get pleaseEnterContent;

  /// No description provided for @inquirySubmitted.
  ///
  /// In en, this message translates to:
  /// **'Inquiry submitted successfully'**
  String get inquirySubmitted;

  /// No description provided for @failedToSubmitInquiry.
  ///
  /// In en, this message translates to:
  /// **'Failed to submit inquiry'**
  String get failedToSubmitInquiry;

  /// No description provided for @failedToLoadInquiries.
  ///
  /// In en, this message translates to:
  /// **'Failed to load inquiries'**
  String get failedToLoadInquiries;

  /// No description provided for @failedToLoadAdminData.
  ///
  /// In en, this message translates to:
  /// **'Failed to load admin data'**
  String get failedToLoadAdminData;

  /// No description provided for @failedToSendReply.
  ///
  /// In en, this message translates to:
  /// **'Failed to send reply'**
  String get failedToSendReply;

  /// No description provided for @noInquiriesYet.
  ///
  /// In en, this message translates to:
  /// **'No inquiries yet'**
  String get noInquiriesYet;

  /// No description provided for @inquiryDetail.
  ///
  /// In en, this message translates to:
  /// **'Inquiry Detail'**
  String get inquiryDetail;

  /// No description provided for @adminReply.
  ///
  /// In en, this message translates to:
  /// **'Admin Reply'**
  String get adminReply;

  /// No description provided for @statusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get statusPending;

  /// No description provided for @statusReplied.
  ///
  /// In en, this message translates to:
  /// **'Replied'**
  String get statusReplied;

  /// No description provided for @users.
  ///
  /// In en, this message translates to:
  /// **'Users'**
  String get users;

  /// No description provided for @inquiries.
  ///
  /// In en, this message translates to:
  /// **'Inquiries'**
  String get inquiries;

  /// No description provided for @pending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pending;

  /// No description provided for @all.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get all;

  /// No description provided for @replied.
  ///
  /// In en, this message translates to:
  /// **'Replied'**
  String get replied;

  /// No description provided for @signupsLast30Days.
  ///
  /// In en, this message translates to:
  /// **'Signups (Last 30 Days)'**
  String get signupsLast30Days;

  /// No description provided for @noDataAvailable.
  ///
  /// In en, this message translates to:
  /// **'No data'**
  String get noDataAvailable;

  /// No description provided for @inquiryManagement.
  ///
  /// In en, this message translates to:
  /// **'Inquiry Management'**
  String get inquiryManagement;

  /// No description provided for @noInquiries.
  ///
  /// In en, this message translates to:
  /// **'No inquiries'**
  String get noInquiries;

  /// No description provided for @reply.
  ///
  /// In en, this message translates to:
  /// **'Reply'**
  String get reply;

  /// No description provided for @sendReply.
  ///
  /// In en, this message translates to:
  /// **'Send Reply'**
  String get sendReply;

  /// No description provided for @replySent.
  ///
  /// In en, this message translates to:
  /// **'Reply sent'**
  String get replySent;

  /// No description provided for @potCalculator.
  ///
  /// In en, this message translates to:
  /// **'Pot'**
  String get potCalculator;

  /// No description provided for @potCalculatorTitle.
  ///
  /// In en, this message translates to:
  /// **'Pot Calculator'**
  String get potCalculatorTitle;

  /// No description provided for @bbSize.
  ///
  /// In en, this message translates to:
  /// **'BB'**
  String get bbSize;

  /// No description provided for @sbSize.
  ///
  /// In en, this message translates to:
  /// **'SB'**
  String get sbSize;

  /// No description provided for @anteSize.
  ///
  /// In en, this message translates to:
  /// **'Ante'**
  String get anteSize;

  /// No description provided for @currentPot.
  ///
  /// In en, this message translates to:
  /// **'Current Pot'**
  String get currentPot;

  /// No description provided for @undo.
  ///
  /// In en, this message translates to:
  /// **'Undo'**
  String get undo;

  /// No description provided for @reset.
  ///
  /// In en, this message translates to:
  /// **'Reset'**
  String get reset;

  /// No description provided for @bbMode.
  ///
  /// In en, this message translates to:
  /// **'BB Mode'**
  String get bbMode;

  /// No description provided for @absoluteMode.
  ///
  /// In en, this message translates to:
  /// **'Absolute'**
  String get absoluteMode;

  /// No description provided for @fullReset.
  ///
  /// In en, this message translates to:
  /// **'Full Reset'**
  String get fullReset;

  /// No description provided for @fullResetConfirm.
  ///
  /// In en, this message translates to:
  /// **'Reset pot, blind structure selection, and ante settings?'**
  String get fullResetConfirm;

  /// No description provided for @newHand.
  ///
  /// In en, this message translates to:
  /// **'New Hand'**
  String get newHand;

  /// No description provided for @lastUndo.
  ///
  /// In en, this message translates to:
  /// **'Last Undo'**
  String get lastUndo;

  /// No description provided for @potDescription.
  ///
  /// In en, this message translates to:
  /// **'Current pot being calculated'**
  String get potDescription;

  /// No description provided for @inputByBb.
  ///
  /// In en, this message translates to:
  /// **'Input by BB'**
  String get inputByBb;

  /// No description provided for @inputByChips.
  ///
  /// In en, this message translates to:
  /// **'Input by chips'**
  String get inputByChips;

  /// No description provided for @nPlayersLabel.
  ///
  /// In en, this message translates to:
  /// **'{count} players'**
  String nPlayersLabel(int count);

  /// No description provided for @currentPotView.
  ///
  /// In en, this message translates to:
  /// **'Current Pot'**
  String get currentPotView;

  /// No description provided for @manual.
  ///
  /// In en, this message translates to:
  /// **'Manual'**
  String get manual;

  /// No description provided for @selectBlindStructure.
  ///
  /// In en, this message translates to:
  /// **'Select Blind Structure'**
  String get selectBlindStructure;

  /// No description provided for @tapToChangeStructure.
  ///
  /// In en, this message translates to:
  /// **'Tap to change structure'**
  String get tapToChangeStructure;

  /// No description provided for @selectPresetStructureHint.
  ///
  /// In en, this message translates to:
  /// **'Select a preset to apply blind levels'**
  String get selectPresetStructureHint;

  /// No description provided for @blindStructure.
  ///
  /// In en, this message translates to:
  /// **'Blind Structure'**
  String get blindStructure;

  /// No description provided for @newStructure.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get newStructure;

  /// No description provided for @noSavedStructures.
  ///
  /// In en, this message translates to:
  /// **'No saved blind structures'**
  String get noSavedStructures;

  /// No description provided for @noLevels.
  ///
  /// In en, this message translates to:
  /// **'No levels'**
  String get noLevels;

  /// No description provided for @nSteps.
  ///
  /// In en, this message translates to:
  /// **'{count} steps'**
  String nSteps(int count);

  /// No description provided for @editLevelN.
  ///
  /// In en, this message translates to:
  /// **'Edit Level {n}'**
  String editLevelN(int n);

  /// No description provided for @anteType.
  ///
  /// In en, this message translates to:
  /// **'Ante Type'**
  String get anteType;

  /// No description provided for @confirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;

  /// No description provided for @editStructure.
  ///
  /// In en, this message translates to:
  /// **'Edit Structure'**
  String get editStructure;

  /// No description provided for @newBlindStructure.
  ///
  /// In en, this message translates to:
  /// **'New Blind Structure'**
  String get newBlindStructure;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @structureNameHint.
  ///
  /// In en, this message translates to:
  /// **'Structure name (e.g. Daily, Monster)'**
  String get structureNameHint;

  /// No description provided for @addLevelsHint.
  ///
  /// In en, this message translates to:
  /// **'Tap + to add blind levels'**
  String get addLevelsHint;

  /// No description provided for @setupSummary.
  ///
  /// In en, this message translates to:
  /// **'SB {sb} / BB {bb}, {ante}, {count} players'**
  String setupSummary(String sb, String bb, String ante, int count);

  /// No description provided for @anteNone.
  ///
  /// In en, this message translates to:
  /// **'No Ante'**
  String get anteNone;

  /// No description provided for @anteBbLabel.
  ///
  /// In en, this message translates to:
  /// **'BB Ante {value}'**
  String anteBbLabel(String value);

  /// No description provided for @anteAllLabel.
  ///
  /// In en, this message translates to:
  /// **'All Ante {value} x {count}'**
  String anteAllLabel(String value, int count);

  /// No description provided for @players.
  ///
  /// In en, this message translates to:
  /// **'Players'**
  String get players;

  /// No description provided for @tableSettings.
  ///
  /// In en, this message translates to:
  /// **'Table Settings'**
  String get tableSettings;

  /// No description provided for @totalAnteCalc.
  ///
  /// In en, this message translates to:
  /// **'Total Ante: {count} players x {ante}'**
  String totalAnteCalc(int count, int ante);

  /// No description provided for @addPreflopPot.
  ///
  /// In en, this message translates to:
  /// **'Add Preflop Pot  ({amount})'**
  String addPreflopPot(String amount);

  /// No description provided for @betPresets.
  ///
  /// In en, this message translates to:
  /// **'Bet Presets'**
  String get betPresets;

  /// No description provided for @betPresetsDesc.
  ///
  /// In en, this message translates to:
  /// **'Instantly add a fraction of the current pot'**
  String get betPresetsDesc;

  /// No description provided for @quickChipAdd.
  ///
  /// In en, this message translates to:
  /// **'Quick Chip Add'**
  String get quickChipAdd;

  /// No description provided for @longPressToRemoveChip.
  ///
  /// In en, this message translates to:
  /// **'Long press to remove custom chip'**
  String get longPressToRemoveChip;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ko'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ko':
      return AppLocalizationsKo();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
