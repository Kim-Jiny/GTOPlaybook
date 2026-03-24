import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/gto_provider.dart';
import '../../models/position_situations.dart';
import 'gto_situation_select_screen.dart';

class GtoPositionSelectScreen extends StatefulWidget {
  const GtoPositionSelectScreen({super.key});

  @override
  State<GtoPositionSelectScreen> createState() => _GtoPositionSelectScreenState();
}

class _GtoPositionSelectScreenState extends State<GtoPositionSelectScreen> {
  final _bbController = TextEditingController();
  final _chipsController = TextEditingController();
  Timer? _debounce;

  static const _positionOrder = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

  static const _positionColors = {
    'UTG': Color(0xFFE53935),
    'MP': Color(0xFFFB8C00),
    'CO': Color(0xFFFDD835),
    'BTN': Color(0xFF43A047),
    'SB': Color(0xFF1E88E5),
    'BB': Color(0xFF8E24AA),
  };

  static const _positionDescriptions = {
    'UTG': 'Under the Gun',
    'MP': 'Middle Position',
    'CO': 'Cut Off',
    'BTN': 'Button',
    'SB': 'Small Blind',
    'BB': 'Big Blind',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final gto = context.read<GtoProvider>();
      if (gto.oneBbValue > 0) _bbController.text = gto.oneBbValue.toString();
      if (gto.chipCount > 0) _chipsController.text = gto.chipCount.toString();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _bbController.dispose();
    _chipsController.dispose();
    super.dispose();
  }

  void _onInputChanged() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      final oneBb = int.tryParse(_bbController.text) ?? 0;
      final chips = int.tryParse(_chipsController.text) ?? 0;
      context.read<GtoProvider>().updateStackDepth(oneBb: oneBb, chips: chips);
    });
  }

  @override
  Widget build(BuildContext context) {
    final gto = context.watch<GtoProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('GTO Charts'),
        centerTitle: true,
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        behavior: HitTestBehavior.translucent,
        child: gto.isLoading
            ? const Center(child: CircularProgressIndicator())
            : gto.error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(gto.error!, style: const TextStyle(color: Colors.redAccent)),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () => gto.loadPositionTree(),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : _buildBody(context, gto),
      ),
    );
  }

  Widget _buildBody(BuildContext context, GtoProvider gto) {
    final treeMap = <String, PositionSituations>{};
    for (final ps in gto.positionTree) {
      treeMap[ps.position] = ps;
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        _buildBbCalculator(gto),
        const SizedBox(height: 12),
        // Header row
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Row(
            children: [
              Text(
                '6-MAX',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _tierColor(gto.selectedTier).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${gto.selectedTier}bb',
                  style: TextStyle(
                    color: _tierColor(gto.selectedTier),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                '${gto.positionTree.fold<int>(0, (sum, ps) => sum + ps.categories.fold<int>(0, (s, c) => s + c.charts.length))} charts',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ],
          ),
        ),
        // Position cards
        ..._positionOrder.map((pos) {
          final hasSituations = treeMap.containsKey(pos);
          final ps = treeMap[pos];
          final chartCount = hasSituations
              ? ps!.categories.fold<int>(0, (sum, c) => sum + c.charts.length)
              : 0;
          final categories = hasSituations
              ? ps!.categories.map((c) => c.category).toList()
              : <String>[];

          return _PositionCard(
            position: pos,
            description: _positionDescriptions[pos]!,
            color: _positionColors[pos]!,
            chartCount: chartCount,
            categories: categories,
            onTap: hasSituations
                ? () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => GtoSituationSelectScreen(
                          positionSituations: treeMap[pos]!,
                        ),
                      ),
                    )
                : null,
          );
        }),
      ],
    );
  }

  Widget _buildBbCalculator(GtoProvider gto) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Input row
          Row(
            children: [
              Expanded(
                child: _BbInputField(
                  label: '1BB',
                  controller: _bbController,
                  onChanged: (_) => _onInputChanged(),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _BbInputField(
                  label: 'My Chips',
                  controller: _chipsController,
                  onChanged: (_) => _onInputChanged(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Result row
          Row(
            children: [
              // Effective BB badge
              if (gto.effectiveBb > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _tierColor(gto.selectedTier).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '= ${gto.effectiveBb}bb effective',
                    style: TextStyle(
                      color: _tierColor(gto.selectedTier),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                )
              else
                Text(
                  'Enter values to calculate stack depth',
                  style: TextStyle(color: Colors.white30, fontSize: 12),
                ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 10),
          // Tier indicator dots
          _buildTierDots(gto.selectedTier),
        ],
      ),
    );
  }

  Widget _buildTierDots(int selectedTier) {
    const tiers = [15, 25, 40, 60, 100];
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: tiers.map((tier) {
        final isSelected = tier == selectedTier;
        return GestureDetector(
          onTap: () {
            _bbController.clear();
            _chipsController.clear();
            context.read<GtoProvider>().selectTier(tier);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            child: Column(
              children: [
                Container(
                  width: isSelected ? 10 : 7,
                  height: isSelected ? 10 : 7,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected
                        ? _tierColor(tier)
                        : Colors.white.withValues(alpha: 0.15),
                    boxShadow: isSelected
                        ? [BoxShadow(color: _tierColor(tier).withValues(alpha: 0.4), blurRadius: 6)]
                        : null,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${tier}bb',
                  style: TextStyle(
                    color: isSelected ? _tierColor(tier) : Colors.white30,
                    fontSize: 10,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Color _tierColor(int tier) {
    switch (tier) {
      case 15:
        return const Color(0xFFE53935); // red — danger zone
      case 25:
        return const Color(0xFFFB8C00); // orange
      case 40:
        return const Color(0xFFFDD835); // yellow
      case 60:
        return const Color(0xFF66BB6A); // light green
      case 100:
        return const Color(0xFF42A5F5); // blue
      default:
        return const Color(0xFF42A5F5);
    }
  }
}

class _BbInputField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  const _BbInputField({
    required this.label,
    required this.controller,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white38, fontSize: 12),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF42A5F5)),
        ),
        isDense: true,
      ),
    );
  }
}

class _PositionCard extends StatelessWidget {
  final String position;
  final String description;
  final Color color;
  final int chartCount;
  final List<String> categories;
  final VoidCallback? onTap;

  const _PositionCard({
    required this.position,
    required this.description,
    required this.color,
    required this.chartCount,
    required this.categories,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Ink(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IntrinsicHeight(
              child: Row(
                children: [
                  // Color accent bar
                  Container(
                    width: 4,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        bottomLeft: Radius.circular(12),
                      ),
                    ),
                  ),
                  // Content
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                position,
                                style: TextStyle(
                                  color: color,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  description,
                                  style: const TextStyle(
                                    color: Colors.white60,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (categories.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 6,
                              runSpacing: 4,
                              children: categories.map((cat) => Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  cat,
                                  style: TextStyle(
                                    color: color.withValues(alpha: 0.85),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              )).toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  // Chart count + arrow
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$chartCount',
                          style: TextStyle(
                            color: Colors.white38,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.chevron_right,
                          color: Colors.white24,
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
