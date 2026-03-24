import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/gto_provider.dart';
import 'providers/equity_provider.dart';
import 'providers/inquiry_provider.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

class GtoPlaybookApp extends StatelessWidget {
  const GtoPlaybookApp({super.key});

  @override
  Widget build(BuildContext context) {
    final apiService = ApiService();

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(apiService)),
        ChangeNotifierProvider(create: (_) => GtoProvider(apiService)),
        ChangeNotifierProvider(create: (_) => EquityProvider()),
        ChangeNotifierProvider(create: (_) => InquiryProvider(apiService)),
      ],
      child: MaterialApp(
        title: 'GTO Playbook',
        debugShowCheckedModeBanner: false,
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
