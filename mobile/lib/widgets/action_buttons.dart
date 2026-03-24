import 'package:flutter/material.dart';

class ActionButtons extends StatefulWidget {
  final int currentBet;
  final int timeLeft;
  final Function(String action, int amount) onAction;

  const ActionButtons({
    super.key,
    required this.currentBet,
    required this.timeLeft,
    required this.onAction,
  });

  @override
  State<ActionButtons> createState() => _ActionButtonsState();
}

class _ActionButtonsState extends State<ActionButtons> {
  double _raiseMultiplier = 2.0;

  @override
  Widget build(BuildContext context) {
    final raiseAmount = (widget.currentBet * _raiseMultiplier).round();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: Color(0xFF1A2E1A),
        border: Border(top: BorderSide(color: Colors.white12)),
      ),
      child: Column(
        children: [
          // Timer
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.timer,
                color: widget.timeLeft <= 5 ? Colors.red : Colors.white54,
                size: 16,
              ),
              const SizedBox(width: 4),
              Text(
                '${widget.timeLeft}s',
                style: TextStyle(
                  color: widget.timeLeft <= 5 ? Colors.red : Colors.white54,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Raise slider
          Row(
            children: [
              Text('${raiseAmount}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
              Expanded(
                child: Slider(
                  value: _raiseMultiplier,
                  min: 2.0,
                  max: 10.0,
                  divisions: 16,
                  onChanged: (v) => setState(() => _raiseMultiplier = v),
                  activeColor: const Color(0xFF4CAF50),
                ),
              ),
            ],
          ),
          // Action buttons
          Row(
            children: [
              Expanded(
                child: _ActionButton(
                  label: 'Fold',
                  color: Colors.grey.shade700,
                  onPressed: () => widget.onAction('fold', 0),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActionButton(
                  label: widget.currentBet > 0 ? 'Call' : 'Check',
                  color: Colors.blue.shade700,
                  onPressed: () => widget.onAction(
                    widget.currentBet > 0 ? 'call' : 'check',
                    0,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActionButton(
                  label: 'Raise $raiseAmount',
                  color: Colors.red.shade700,
                  onPressed: () => widget.onAction('raise', raiseAmount),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 60,
                child: _ActionButton(
                  label: 'All In',
                  color: const Color(0xFFFF6F00),
                  onPressed: () => widget.onAction('all_in', 0),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onPressed;

  const _ActionButton({
    required this.label,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(horizontal: 4),
        ),
        child: FittedBox(
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
        ),
      ),
    );
  }
}
