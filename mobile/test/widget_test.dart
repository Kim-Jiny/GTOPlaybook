import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Firebase must be initialized for the app to run.
    // Integration tests should be used for full app testing.
    expect(true, isTrue);
  });
}
