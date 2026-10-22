import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';

/// "Pop" cartoon look: warm cream (or deep grape in dark mode), thick dark
/// outlines, flat candy colors and hard offset shadows. Screens should read
/// colors from the theme or the [AppColors] extension below instead of
/// hard-coding white/black.
class AppTheme {
  static const display = 'Jua';

  // Brand candy colors (same in both modes).
  static const mint = Color(0xFF1FBF8F);
  static const mintLight = Color(0xFF7CE3C0);
  static const yellow = Color(0xFFFFC93C);
  static const pink = Color(0xFFFF7BAC);
  static const sky = Color(0xFF5CC8FF);
  static const grape = Color(0xFF9B7BFF);
  static const coral = Color(0xFFFF6B5E);

  static const lightBackground = Color(0xFFFFF6E5);
  static const darkBackground = Color(0xFF1C1633);
  static const lightOutline = Color(0xFF2B2140);
  static const darkOutline = Color(0xFF0B0716);

  /// Standard motion tokens so screens animate consistently.
  static const fast = Duration(milliseconds: 160);
  static const normal = Duration(milliseconds: 280);
  static const slow = Duration(milliseconds: 460);
  static const curve = Curves.easeOutCubic;
  static const bounce = Curves.easeOutBack;

  static const _pageTransitions = PageTransitionsTheme(
    builders: {
      TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
    },
  );

  static ThemeData dark() => _build(
        brightness: Brightness.dark,
        background: darkBackground,
        card: const Color(0xFF2E2552),
        outline: darkOutline,
        ink: Colors.white,
      );

  static ThemeData light() => _build(
        brightness: Brightness.light,
        background: lightBackground,
        card: Colors.white,
        outline: lightOutline,
        ink: lightOutline,
      );

  static ThemeData _build({
    required Brightness brightness,
    required Color background,
    required Color card,
    required Color outline,
    required Color ink,
  }) {
    final isDark = brightness == Brightness.dark;
    final scheme = ColorScheme.fromSeed(
      seedColor: mint,
      brightness: brightness,
    ).copyWith(
      primary: mint,
      onPrimary: lightOutline,
      secondary: yellow,
      onSecondary: lightOutline,
      surface: card,
      onSurface: ink,
      outline: outline,
    );

    final border = BorderSide(color: outline, width: 2);
    RoundedRectangleBorder shape(double r) =>
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(r), side: border);
    const buttonText = TextStyle(fontFamily: display, fontSize: 17, letterSpacing: 0.2);

    final base = isDark ? Typography.whiteMountainView : Typography.blackMountainView;
    final text = base
        .apply(bodyColor: ink, displayColor: ink)
        .copyWith(
          headlineLarge: base.headlineLarge?.copyWith(fontFamily: display, color: ink),
          headlineMedium: base.headlineMedium?.copyWith(fontFamily: display, color: ink),
          headlineSmall: base.headlineSmall?.copyWith(fontFamily: display, color: ink),
          titleLarge: base.titleLarge?.copyWith(fontFamily: display, color: ink),
          titleMedium: base.titleMedium?.copyWith(fontFamily: display, color: ink),
          displaySmall: base.displaySmall?.copyWith(fontFamily: display, color: ink),
        );

    return ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      pageTransitionsTheme: _pageTransitions,
      splashFactory: InkRipple.splashFactory,
      textTheme: text,
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: display,
          color: ink,
          fontSize: 22,
          letterSpacing: 0.2,
        ),
        iconTheme: IconThemeData(color: ink),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        margin: EdgeInsets.zero,
        surfaceTintColor: Colors.transparent,
        shape: shape(20),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          shape: shape(16),
          textStyle: buttonText,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          shape: shape(16),
          textStyle: buttonText,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          shape: shape(16),
          side: border,
          foregroundColor: ink,
          textStyle: buttonText,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: isDark ? mintLight : const Color(0xFF138A66),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? const Color(0xFF241D40) : Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: border,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: border,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: mint, width: 2.5),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: card,
        surfaceTintColor: Colors.transparent,
        shape: shape(26),
        titleTextStyle: TextStyle(fontFamily: display, fontSize: 22, color: ink),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: card,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        shape: RoundedRectangleBorder(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          side: border,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? const Color(0xFF3A2F66) : lightOutline,
        contentTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      chipTheme: ChipThemeData(
        shape: StadiumBorder(side: border),
        side: border,
        selectedColor: mint,
        backgroundColor: card,
        checkmarkColor: lightOutline,
        labelStyle: TextStyle(fontWeight: FontWeight.w700, color: ink),
        secondaryLabelStyle: const TextStyle(fontWeight: FontWeight.w700, color: lightOutline),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          side: WidgetStatePropertyAll(border),
          backgroundColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? mint : card,
          ),
          foregroundColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? lightOutline : ink,
          ),
          textStyle: const WidgetStatePropertyAll(
            TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ),
      tabBarTheme: TabBarThemeData(
        indicatorColor: mint,
        labelColor: ink,
        unselectedLabelColor: ink.withValues(alpha: 0.55),
        dividerColor: Colors.transparent,
        labelStyle: const TextStyle(fontFamily: display, fontSize: 16),
        unselectedLabelStyle: const TextStyle(fontFamily: display, fontSize: 16),
        indicatorSize: TabBarIndicatorSize.tab,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: const WidgetStatePropertyAll(Colors.white),
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? mint : ink.withValues(alpha: 0.25),
        ),
        trackOutlineColor: WidgetStatePropertyAll(outline),
      ),
      dividerTheme: DividerThemeData(color: outline.withValues(alpha: 0.18), space: 1),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: mint),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: mint,
        foregroundColor: lightOutline,
        elevation: 0,
        shape: shape(18),
      ),
    );
  }
}

extension AppColors on BuildContext {
  bool get isLight => Theme.of(this).brightness == Brightness.light;

  /// Primary text / icon color on the app background.
  Color get ink => isLight ? AppTheme.lightOutline : Colors.white;
  Color get ink70 => ink.withValues(alpha: 0.7);
  Color get ink60 => ink.withValues(alpha: 0.6);
  Color get ink54 => ink.withValues(alpha: 0.54);
  Color get ink38 => ink.withValues(alpha: 0.38);
  Color get ink30 => ink.withValues(alpha: 0.3);
  Color get ink24 => ink.withValues(alpha: 0.24);
  Color get ink12 => ink.withValues(alpha: 0.12);
  Color get ink10 => ink.withValues(alpha: 0.1);
  Color get ink08 => ink.withValues(alpha: 0.08);
  Color get ink04 => ink.withValues(alpha: 0.04);

  /// Raised surfaces (cards, tiles) from lightest to deepest.
  Color get panel => isLight ? Colors.white : const Color(0xFF2E2552);
  Color get panelDim => isLight ? const Color(0xFFFFEFD0) : const Color(0xFF261E45);
  Color get panelDeep => isLight ? const Color(0xFFFFE6B8) : const Color(0xFF1A1431);

  /// Dialog / card background.
  Color get card => panel;

  /// Brand mint that stays readable on the current background.
  Color get accent => AppTheme.mint;
  Color get accentSoft => isLight ? const Color(0xFF138A66) : AppTheme.mintLight;

  /// Text/icon color to place on top of [accent] and other candy fills.
  Color get onAccent => AppTheme.lightOutline;

  Color get gold => AppTheme.yellow;

  /// Solid cartoon outline.
  Color get outline => isLight ? AppTheme.lightOutline : AppTheme.darkOutline;

  /// Soft separator for places a full outline would be too loud.
  Color get hairline => ink.withValues(alpha: isLight ? 0.14 : 0.12);

  /// Hard, blur-free drop shadow used under cartoon cards and buttons.
  List<BoxShadow> get popShadow => [
        BoxShadow(color: outline, offset: const Offset(0, 4)),
      ];
}
