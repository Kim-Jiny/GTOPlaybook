import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/gto_provider.dart';
import '../providers/purchase_provider.dart';
import '../services/admin_push_service.dart';
import '../services/api_service.dart';
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
        if (auth.isAdmin) {
          AdminPushService.instance.register(context.read<ApiService>());
        }
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
      bottomNavigationBar: _PopNavBar(
        index: _currentIndex,
        onSelected: (i) {
          if (i == _currentIndex) return;
          HapticFeedback.selectionClick();
          setState(() => _currentIndex = i);
        },
        items: [
          _NavSpec(Icons.grid_view_rounded, l.gtoCharts, AppTheme.mint),
          _NavSpec(Icons.pie_chart_rounded, l.equity, AppTheme.sky),
          _NavSpec(Icons.paid_rounded, l.potCalculator, AppTheme.yellow),
          _NavSpec(Icons.face_rounded, l.myPage, AppTheme.pink),
        ],
      ),
    );
  }
}

class _NavSpec {
  final IconData icon;
  final String label;
  final Color color;
  const _NavSpec(this.icon, this.label, this.color);
}

class _PopNavBar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onSelected;
  final List<_NavSpec> items;

  const _PopNavBar({
    required this.index,
    required this.onSelected,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.panel,
        border: Border(top: BorderSide(color: context.outline, width: 2)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++)
                Expanded(
                  child: _NavItem(
                    spec: items[i],
                    selected: i == index,
                    onTap: () => onSelected(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final _NavSpec spec;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({required this.spec, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: AppTheme.normal,
            curve: AppTheme.bounce,
            width: selected ? 58 : 40,
            height: 36,
            decoration: BoxDecoration(
              color: selected ? spec.color : Colors.transparent,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: selected ? context.outline : Colors.transparent,
                width: 2,
              ),
              boxShadow: selected
                  ? [BoxShadow(color: context.outline, offset: const Offset(0, 3))]
                  : const [],
            ),
            child: AnimatedScale(
              scale: selected ? 1.15 : 1,
              duration: AppTheme.slow,
              curve: Curves.elasticOut,
              child: Icon(
                spec.icon,
                size: 24,
                color: selected ? AppTheme.lightOutline : context.ink54,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            spec.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: AppTheme.display,
              fontSize: 12,
              color: selected ? context.ink : context.ink54,
            ),
          ),
        ],
      ),
    );
  }
}
