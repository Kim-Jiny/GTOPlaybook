class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3010',
  );

  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'http://localhost:3010',
  );

  static const int defaultBuyIn = 2000;
  static const int defaultSmallBlind = 10;
  static const int defaultBigBlind = 20;
}
