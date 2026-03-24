import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/game_provider.dart';
import '../providers/lobby_provider.dart';
import 'gto/gto_chart_list_screen.dart';
import 'game/lobby_screen.dart';
import 'profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final _screens = const [
    GtoChartListScreen(),
    LobbyScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();
    if (auth.user != null) {
      context.read<GameProvider>().init(auth.user!.uid);
      context.read<LobbyProvider>().init();
    }
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
            icon: Icon(Icons.casino),
            selectedIcon: Icon(Icons.casino, color: Color(0xFF4CAF50)),
            label: 'Game',
          ),
          NavigationDestination(
            icon: Icon(Icons.person),
            selectedIcon: Icon(Icons.person, color: Color(0xFF4CAF50)),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
