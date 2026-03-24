import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/player_stats.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  PlayerStats? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final api = ApiService();
      final auth = context.read<AuthProvider>();
      final token = await auth.user?.getIdToken();
      if (token != null) api.setToken(token);
      final data = await api.get('/api/games/stats');
      setState(() {
        _stats = PlayerStats.fromJson(data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => auth.signOut(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Avatar
            CircleAvatar(
              radius: 48,
              backgroundImage: user?.photoURL != null ? NetworkImage(user!.photoURL!) : null,
              child: user?.photoURL == null
                  ? const Icon(Icons.person, size: 48)
                  : null,
            ),
            const SizedBox(height: 12),
            Text(
              user?.displayName ?? 'Player',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              user?.email ?? '',
              style: const TextStyle(color: Colors.white54),
            ),
            const SizedBox(height: 24),
            // Stats
            if (_isLoading)
              const CircularProgressIndicator()
            else if (_stats != null) ...[
              _StatRow('Hands Played', '${_stats!.handsPlayed}'),
              _StatRow('Hands Won', '${_stats!.handsWon}'),
              _StatRow('Win Rate', '${_stats!.winRate.toStringAsFixed(1)}%'),
              _StatRow('Total Winnings', '${_stats!.totalWinnings}'),
              _StatRow('Biggest Pot', '${_stats!.biggestPot}'),
              _StatRow('VPIP', '${_stats!.vpip.toStringAsFixed(1)}%'),
              _StatRow('PFR', '${_stats!.pfr.toStringAsFixed(1)}%'),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  final String label;
  final String value;
  const _StatRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 16)),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
