import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../config/legal_links.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/ui_kit.dart';

/// Friendly sign-in error (null = nothing to show, e.g. the user cancelled).
String? _loginError(AppLocalizations l, String? raw) {
  if (raw == null) return null;
  if (RegExp(r'cancel|canceled|cancelled|aborted', caseSensitive: false).hasMatch(raw)) {
    return null;
  }
  if (RegExp(r'network|SocketException|ClientException|Timeout', caseSensitive: false)
      .hasMatch(raw)) {
    return l.errorNetworkMessage;
  }
  return l.errorGenericTitle;
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      body: Stack(
        children: [
          const _FloatingSuits(),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const _CardFan(),
                    const SizedBox(height: 36),
                    Text(
                      l.appTitle,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        fontSize: 38,
                        color: context.ink,
                      ),
                    )
                        .animate(delay: 500.ms)
                        .fadeIn(duration: AppTheme.normal)
                        .slideY(begin: 0.4, end: 0, curve: AppTheme.bounce, duration: AppTheme.slow),
                    const SizedBox(height: 8),
                    Text(
                      l.masterYourPokerGame,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: context.ink60,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ).animate(delay: 650.ms).fadeIn(duration: AppTheme.slow),
                    const SizedBox(height: 44),
                    if (_loginError(l, auth.error) != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Text(
                          _loginError(l, auth.error)!,
                          style: const TextStyle(
                            color: AppTheme.coral,
                            fontWeight: FontWeight.w700,
                          ),
                          textAlign: TextAlign.center,
                        ).animate().shakeX(hz: 4, amount: 6),
                      ),
                    PopButton(
                      label: l.continueWithGoogle,
                      icon: Icons.g_mobiledata_rounded,
                      color: Colors.white,
                      textColor: AppTheme.lightOutline,
                      loading: auth.isLoading,
                      onPressed: () => auth.signInWithGoogle(),
                    ).staggerIn(7, stepMs: 70),
                    if (auth.isAppleSignInAvailable) ...[
                      const SizedBox(height: 12),
                      // Apple HIG: the Sign in with Apple button must be black or white.
                      PopButton(
                        label: l.continueWithApple,
                        icon: Icons.apple,
                        color: Colors.black,
                        textColor: Colors.white,
                        loading: auth.isLoading,
                        onPressed: () => auth.signInWithApple(),
                      ).staggerIn(8, stepMs: 70),
                    ],
                    const SizedBox(height: 24),
                    Wrap(
                      alignment: WrapAlignment.center,
                      children: [
                        TextButton(
                          onPressed: () => LegalLinks.open(context, LegalLinks.privacy),
                          child: Text(l.privacyPolicy),
                        ),
                        TextButton(
                          onPressed: () => LegalLinks.open(context, LegalLinks.terms),
                          child: Text(l.termsOfService),
                        ),
                      ],
                    ).animate(delay: 900.ms).fadeIn(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Three oversized playing cards that pop in and then sway.
class _CardFan extends StatelessWidget {
  const _CardFan();

  static const _cards = [
    ('K', '♥', AppTheme.coral, -0.22, -52.0),
    ('Q', '♦', AppTheme.coral, 0.22, 52.0),
    ('A', '♠', AppTheme.lightOutline, 0.0, 0.0),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      height: 170,
      child: Stack(
        alignment: Alignment.center,
        children: [
          for (var i = 0; i < _cards.length; i++)
            Transform.translate(
              offset: Offset(_cards[i].$5, i == 2 ? -6 : 8),
              child: Transform.rotate(
                angle: _cards[i].$4,
                child: _BigCard(
                  rank: _cards[i].$1,
                  suit: _cards[i].$2,
                  color: _cards[i].$3,
                ),
              ),
            )
                .animate(delay: (i * 140).ms)
                .fadeIn(duration: AppTheme.fast)
                .moveY(begin: 80, end: 0, duration: 700.ms, curve: Curves.elasticOut)
                .scaleXY(begin: 0.5, end: 1, duration: 600.ms, curve: AppTheme.bounce)
                .then()
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .moveY(
                  begin: 0,
                  end: i.isEven ? -5 : 5,
                  duration: (1800 + i * 250).ms,
                  curve: Curves.easeInOut,
                ),
        ],
      ),
    );
  }
}

class _BigCard extends StatelessWidget {
  final String rank;
  final String suit;
  final Color color;

  const _BigCard({required this.rank, required this.suit, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      height: 140,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: context.outline, width: 3),
        boxShadow: [BoxShadow(color: context.outline, offset: const Offset(0, 5))],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            rank,
            style: TextStyle(
              fontFamily: AppTheme.display,
              fontSize: 52,
              height: 1,
              color: color,
            ),
          ),
          Text(suit, style: TextStyle(fontSize: 38, height: 1, color: color)),
        ],
      ),
    );
  }
}

/// Faint suit symbols drifting in the background.
class _FloatingSuits extends StatelessWidget {
  const _FloatingSuits();

  static const _items = [
    ('♠', 0.08, 0.10, 34.0, AppTheme.grape),
    ('♥', 0.82, 0.14, 40.0, AppTheme.pink),
    ('♦', 0.12, 0.72, 44.0, AppTheme.yellow),
    ('♣', 0.80, 0.78, 36.0, AppTheme.mint),
    ('♥', 0.50, 0.04, 26.0, AppTheme.sky),
  ];

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    return IgnorePointer(
      child: Stack(
        children: [
          for (var i = 0; i < _items.length; i++)
            Positioned(
              left: size.width * _items[i].$2,
              top: size.height * _items[i].$3,
              child: Text(
                _items[i].$1,
                style: TextStyle(
                  fontSize: _items[i].$4,
                  color: _items[i].$5.withValues(alpha: 0.35),
                ),
              )
                  .animate(onPlay: (c) => c.repeat(reverse: true), delay: (i * 300).ms)
                  .moveY(begin: -6, end: 10, duration: (2400 + i * 300).ms, curve: Curves.easeInOut)
                  .rotate(begin: -0.05, end: 0.05, duration: (2400 + i * 300).ms),
            ),
        ],
      ),
    );
  }
}
