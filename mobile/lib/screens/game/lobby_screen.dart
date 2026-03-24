import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/lobby_provider.dart';
import '../../providers/game_provider.dart';
import '../../models/game_state.dart';
import 'poker_table_screen.dart';

class LobbyScreen extends StatelessWidget {
  const LobbyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lobby = context.watch<LobbyProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Game Lobby'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => lobby.refreshRooms(),
          ),
        ],
      ),
      body: lobby.isLoading
          ? const Center(child: CircularProgressIndicator())
          : lobby.rooms.isEmpty
              ? const Center(
                  child: Text(
                    'No rooms available\nCreate one!',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white54, fontSize: 16),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: lobby.rooms.length,
                  itemBuilder: (context, i) => _RoomCard(room: lobby.rooms[i]),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateRoomDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Create Room'),
        backgroundColor: const Color(0xFF4CAF50),
      ),
    );
  }

  void _showCreateRoomDialog(BuildContext context) {
    final nameController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Room'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            hintText: 'Room name',
            border: OutlineInputBorder(),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final name = nameController.text.trim();
              if (name.isNotEmpty) {
                context.read<LobbyProvider>().createRoom(name);
                Navigator.pop(ctx);
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

class _RoomCard extends StatelessWidget {
  final GameRoom room;
  const _RoomCard({required this.room});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: room.status == 'playing' ? Colors.orange : const Color(0xFF4CAF50),
          child: Text(
            '${room.playerCount}/${room.maxPlayers}',
            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(room.name, style: const TextStyle(color: Colors.white)),
        subtitle: Text(
          'Blinds: ${room.smallBlind}/${room.bigBlind} | ${room.status}',
          style: const TextStyle(color: Colors.white54),
        ),
        trailing: FilledButton(
          onPressed: room.playerCount >= room.maxPlayers
              ? null
              : () => _joinRoom(context, room.id),
          child: const Text('Join'),
        ),
      ),
    );
  }

  void _joinRoom(BuildContext context, String roomId) {
    context.read<LobbyProvider>().joinRoom(roomId, (result) {
      if (result['success'] == true) {
        context.read<GameProvider>().joinRoom(roomId);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => PokerTableScreen(roomId: roomId),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error']?.toString() ?? 'Failed to join')),
        );
      }
    });
  }
}
