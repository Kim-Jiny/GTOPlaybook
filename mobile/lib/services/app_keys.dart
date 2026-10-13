import 'package:flutter/material.dart';

/// App-wide keys so code outside the widget tree (push handlers) can show UI.
class AppKeys {
  static final navigator = GlobalKey<NavigatorState>();
  static final messenger = GlobalKey<ScaffoldMessengerState>();
}
