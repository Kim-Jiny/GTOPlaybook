import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/gto_provider.dart';
import 'providers/equity_provider.dart';
import 'providers/hand_analysis_provider.dart';
import 'providers/inquiry_provider.dart';
import 'providers/admin_inquiry_provider.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

class GtoPlaybookApp extends StatelessWidget {
  final bool platformSupported;
  final String currentPlatformLabel;

  const GtoPlaybookApp({
    super.key,
    this.platformSupported = true,
    this.currentPlatformLabel = '',
  });

  @override
  Widget build(BuildContext context) {
    if (!platformSupported) {
      return MaterialApp(
        title: 'GTO Playbook',
        debugShowCheckedModeBanner: false,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('en'),
          Locale('ko'),
        ],
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF1B5E20),
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFF0A1A0A),
          cardTheme: const CardThemeData(
            color: Color(0xFF1A2E1A),
          ),
        ),
        home: _UnsupportedPlatformScreen(
          currentPlatformLabel: currentPlatformLabel,
        ),
      );
    }

    final apiService = ApiService();

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(apiService)),
        ChangeNotifierProvider(create: (_) => GtoProvider(apiService)),
        ChangeNotifierProvider(create: (_) => EquityProvider()),
        ChangeNotifierProvider(create: (_) => HandAnalysisProvider()),
        ChangeNotifierProvider(create: (_) => InquiryProvider(apiService)),
        ChangeNotifierProvider(create: (_) => AdminInquiryProvider(apiService)),
      ],
      child: MaterialApp(
        title: 'GTO Playbook',
        debugShowCheckedModeBanner: false,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('en'),
          Locale('ko'),
        ],
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF1B5E20),
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFF0A1A0A),
          cardTheme: const CardThemeData(
            color: Color(0xFF1A2E1A),
          ),
        ),
        home: Consumer<AuthProvider>(
          builder: (context, auth, _) {
            if (auth.isInitializing) {
              return const Scaffold(
                body: Center(
                  child: CircularProgressIndicator(),
                ),
              );
            }
            if (auth.isAuthenticated) {
              return const HomeScreen();
            }
            return const LoginScreen();
          },
        ),
      ),
    );
  }
}

class _UnsupportedPlatformScreen extends StatelessWidget {
  final String currentPlatformLabel;

  const _UnsupportedPlatformScreen({required this.currentPlatformLabel});

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final isKorean = locale.languageCode == 'ko';

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.phonelink_erase,
                size: 72,
                color: Colors.white54,
              ),
              const SizedBox(height: 16),
              Text(
                isKorean
                    ? '현재 플랫폼에서는 앱 기능을 지원하지 않습니다.'
                    : 'This app is not supported on the current platform.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                isKorean
                    ? '$currentPlatformLabel 환경에서는 Firebase 로그인과 광고 SDK가 준비되지 않았습니다. Android 또는 iOS에서 실행해 주세요.'
                    : 'Firebase sign-in and mobile ads are not configured for $currentPlatformLabel. Please run the app on Android or iOS.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white70,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
