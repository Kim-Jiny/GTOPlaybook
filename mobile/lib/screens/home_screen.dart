import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/gto_provider.dart';
import 'gto/gto_position_select_screen.dart';
import 'equity/equity_calculator_screen.dart';
import 'profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final _screens = const [
    GtoPositionSelectScreen(),
    EquityCalculatorScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final auth = context.read<AuthProvider>();
      if (auth.user != null) {
        final gto = context.read<GtoProvider>();
        await gto.loadSavedStackSettings();
        gto.loadPositionTree();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.grid_on),
            selectedIcon: Icon(Icons.grid_on, color: Color(0xFF4CAF50)),
            label: 'GTO Charts',
          ),
          NavigationDestination(
            icon: Icon(Icons.calculate),
            selectedIcon: Icon(Icons.calculate, color: Color(0xFF4CAF50)),
            label: 'Equity',
          ),
          NavigationDestination(
            icon: Icon(Icons.person),
            selectedIcon: Icon(Icons.person, color: Color(0xFF4CAF50)),
            label: 'My Page',
          ),
        ],
      ),
    );
  }
}
