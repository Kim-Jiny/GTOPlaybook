import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/gto_provider.dart';
import '../providers/purchase_provider.dart';
import 'gto/gto_position_select_screen.dart';
import 'equity/equity_tab_screen.dart';
import 'pot_calculator/pot_calculator_screen.dart';
import 'profile/profile_screen.dart';
import '../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final _screens = const [
    GtoPositionSelectScreen(),
    EquityTabScreen(),
    PotCalculatorScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final auth = context.read<AuthProvider>();
      if (auth.user != null) {
        final gto = context.read<GtoProvider>();
        context.read<PurchaseProvider>().refresh();
        await gto.loadSavedStackSettings();
        gto.loadPositionTree();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.grid_on),
            selectedIcon: Icon(Icons.grid_on, color: context.accent),
            label: l.gtoCharts,
          ),
          NavigationDestination(
            icon: const Icon(Icons.calculate),
            selectedIcon: Icon(Icons.calculate, color: context.accent),
            label: l.equity,
          ),
          NavigationDestination(
            icon: const Icon(Icons.monetization_on),
            selectedIcon: Icon(Icons.monetization_on, color: context.accent),
            label: l.potCalculator,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person),
            selectedIcon: Icon(Icons.person, color: context.accent),
            label: l.myPage,
          ),
        ],
      ),
    );
  }
}
