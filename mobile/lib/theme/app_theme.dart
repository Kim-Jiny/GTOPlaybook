import 'package:flutter/material.dart';

/// Light and dark themes. Screens should read colors from the theme or from
/// the [AppColors] extension below instead of hard-coding white/black.
class AppTheme {
  static const _seed = Color(0xFF1B5E20);

  static ThemeData dark() => ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: _seed,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF0A1A0A),
        cardTheme: const CardThemeData(color: Color(0xFF1A2E1A)),
      );

  static ThemeData light() => ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: _seed,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF3F7F3),
        cardTheme: const CardThemeData(color: Colors.white),
      );
}

extension AppColors on BuildContext {
  bool get isLight => Theme.of(this).brightness == Brightness.light;

  /// Primary text / icon color on the app background (white in dark mode).
  Color get ink => isLight ? const Color(0xFF14201A) : Colors.white;
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
  Color get panel => isLight ? Colors.white : const Color(0xFF1E1E1E);
  Color get panelDim => isLight ? const Color(0xFFF1F5F1) : const Color(0xFF161616);
  Color get panelDeep => isLight ? const Color(0xFFE6EDE6) : const Color(0xFF121212);

  /// Dialog / card background with the app's green tint in dark mode.
  Color get card => isLight ? Colors.white : const Color(0xFF1A2E1A);

  /// Brand green that stays readable on the current background.
  Color get accent => isLight ? const Color(0xFF2E7D32) : const Color(0xFF4CAF50);
  Color get accentSoft => isLight ? const Color(0xFF388E3C) : const Color(0xFF81C784);
}
