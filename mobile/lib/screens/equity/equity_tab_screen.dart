import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../providers/equity_provider.dart';
import '../../providers/hand_analysis_provider.dart';
import 'equity_calculator_screen.dart';
import 'hand_analysis_screen.dart';

class EquityTabScreen extends StatefulWidget {
  const EquityTabScreen({super.key});

  @override
  State<EquityTabScreen> createState() => _EquityTabScreenState();
}

class _EquityTabScreenState extends State<EquityTabScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_handleTabChange);
  }

  void _handleTabChange() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(_tabController.index == 0 ? l.equityCalculator : l.handAnalyzer),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              if (_tabController.index == 0) {
                context.read<EquityProvider>().reset();
              } else {
                context.read<HandAnalysisProvider>().reset();
              }
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF4CAF50),
          labelColor: const Color(0xFF4CAF50),
          unselectedLabelColor: Colors.white60,
          tabs: [
            Tab(text: l.equityCalculator),
            Tab(text: l.handAnalyzer),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _EquityCalculatorBody(),
          HandAnalysisScreen(),
        ],
      ),
    );
  }
}

/// Extracted body of the equity calculator (without Scaffold/AppBar)
class _EquityCalculatorBody extends StatelessWidget {
  const _EquityCalculatorBody();

  @override
  Widget build(BuildContext context) {
    // Reuse the existing equity calculator screen body
    return const EquityCalculatorScreen(embedded: true);
  }
}
