import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/foundation.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import '../theme/app_theme.dart';

/// Scale-on-press wrapper with a light haptic. Use for any tappable thing that
/// does not need the full [PopCard] look.
class Pressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  final bool haptic;

  const Pressable({
    super.key,
    required this.child,
    this.onTap,
    this.scale = 0.95,
    this.haptic = true,
  });

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (widget.onTap == null || _down == v) return;
    setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => _set(true),
      onTapCancel: () => _set(false),
      onTapUp: (_) => _set(false),
      onTap: widget.onTap == null
          ? null
          : () {
              if (widget.haptic) HapticFeedback.selectionClick();
              widget.onTap!();
            },
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: _down ? AppTheme.fast : AppTheme.normal,
        curve: _down ? AppTheme.curve : Curves.elasticOut,
        child: widget.child,
      ),
    );
  }
}

/// Cartoon card: flat fill, thick outline and a hard drop shadow. When [onTap]
/// is set it physically presses down into its shadow.
class PopCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final Color? color;
  final double radius;
  final EdgeInsetsGeometry padding;
  final bool haptic;

  const PopCard({
    super.key,
    required this.child,
    this.onTap,
    this.color,
    this.radius = 20,
    this.padding = EdgeInsets.zero,
    this.haptic = true,
  });

  @override
  State<PopCard> createState() => _PopCardState();
}

class _PopCardState extends State<PopCard> {
  bool _down = false;

  void _set(bool v) {
    if (widget.onTap == null || _down == v) return;
    setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    const depth = 4.0;
    final card = AnimatedContainer(
      duration: AppTheme.fast,
      curve: AppTheme.curve,
      transform: Matrix4.translationValues(0, _down ? depth : 0, 0),
      padding: widget.padding,
      decoration: BoxDecoration(
        color: widget.color ?? context.panel,
        borderRadius: BorderRadius.circular(widget.radius),
        border: Border.all(color: context.outline, width: 2),
        boxShadow: _down
            ? const []
            : [BoxShadow(color: context.outline, offset: const Offset(0, depth))],
      ),
      child: widget.child,
    );
    final padded = Padding(padding: const EdgeInsets.only(bottom: depth), child: card);

    if (widget.onTap == null) return padded;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => _set(true),
      onTapCancel: () => _set(false),
      onTapUp: (_) => _set(false),
      onTap: () {
        if (widget.haptic) HapticFeedback.selectionClick();
        widget.onTap!();
      },
      child: padded,
    );
  }
}

/// Chunky cartoon button (filled, outlined, hard shadow, press-down).
class PopButton extends StatefulWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final Color? color;
  final Color? textColor;
  final bool loading;
  final double height;
  final bool expand;

  const PopButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.color,
    this.textColor,
    this.loading = false,
    this.height = 54,
    this.expand = true,
  });

  @override
  State<PopButton> createState() => _PopButtonState();
}

class _PopButtonState extends State<PopButton> {
  bool _down = false;

  bool get _enabled => widget.onPressed != null && !widget.loading;

  @override
  Widget build(BuildContext context) {
    const depth = 4.0;
    final fill = _enabled
        ? (widget.color ?? context.accent)
        : context.ink.withValues(alpha: 0.18);
    final fg = _enabled ? (widget.textColor ?? context.onAccent) : context.ink38;

    final content = Row(
      mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.loading)
          SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(strokeWidth: 3, strokeCap: StrokeCap.round, color: fg),
          )
        else ...[
          if (widget.icon != null) ...[
            Icon(widget.icon, size: 22, color: fg),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Text(
              widget.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: AppTheme.display,
                fontSize: 18,
                color: fg,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ],
      ],
    );

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: _enabled ? (_) => setState(() => _down = true) : null,
      onTapCancel: () => setState(() => _down = false),
      onTapUp: (_) => setState(() => _down = false),
      onTap: _enabled
          ? () {
              HapticFeedback.mediumImpact();
              widget.onPressed!();
            }
          : null,
      child: Padding(
        padding: const EdgeInsets.only(bottom: depth),
        child: AnimatedContainer(
          duration: AppTheme.fast,
          curve: AppTheme.curve,
          height: widget.height - depth,
          transform: Matrix4.translationValues(0, _down ? depth : 0, 0),
          padding: const EdgeInsets.symmetric(horizontal: 18),
          decoration: BoxDecoration(
            color: fill,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: context.outline, width: 2),
            boxShadow: _down || !_enabled
                ? const []
                : [BoxShadow(color: context.outline, offset: const Offset(0, depth))],
          ),
          child: content,
        ),
      ),
    );
  }
}

/// Small outlined sticker label ("12 charts", "BTN", "100bb").
class PopTag extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;
  final double fontSize;

  const PopTag({
    super.key,
    required this.label,
    required this.color,
    this.icon,
    this.fontSize = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: fontSize * 0.4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: context.outline, width: 1.6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: fontSize + 2, color: AppTheme.lightOutline),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontFamily: AppTheme.display,
              fontSize: fontSize,
              color: AppTheme.lightOutline,
              height: 1.15,
            ),
          ),
        ],
      ),
    );
  }
}

/// Bouncy staggered entrance for list items.
extension StaggerIn on Widget {
  Widget staggerIn(int index, {int stepMs = 55, int maxSteps = 10}) {
    final delay = Duration(milliseconds: stepMs * index.clamp(0, maxSteps));
    return animate(delay: delay)
        .fadeIn(duration: AppTheme.fast, curve: AppTheme.curve)
        .slideY(begin: 0.18, end: 0, duration: AppTheme.slow, curve: AppTheme.bounce)
        .scaleXY(begin: 0.96, end: 1, duration: AppTheme.slow, curve: AppTheme.bounce);
  }
}

/// Animated number that counts from its previous value to [value].
class CountUp extends StatelessWidget {
  final double value;
  final int decimals;
  final String prefix;
  final String suffix;
  final TextStyle? style;
  final Duration duration;

  const CountUp({
    super.key,
    required this.value,
    this.decimals = 0,
    this.prefix = '',
    this.suffix = '',
    this.style,
    this.duration = const Duration(milliseconds: 700),
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(end: value),
      duration: duration,
      curve: AppTheme.curve,
      builder: (_, v, _) => Text(
        '$prefix${v.toStringAsFixed(decimals)}$suffix',
        style: style,
      ),
    );
  }
}

/// Rounded placeholder block with a shimmer sweep.
class SkeletonBox extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;

  const SkeletonBox({super.key, this.width, this.height = 16, this.radius = 14});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: context.ink10,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: context.ink12, width: 2),
      ),
    ).animate(onPlay: (c) => c.repeat()).shimmer(
          duration: 1300.ms,
          color: context.ink.withValues(alpha: 0.10),
        );
  }
}

/// Full-area skeleton list shown while content loads.
class SkeletonList extends StatelessWidget {
  final int count;
  final double itemHeight;

  const SkeletonList({super.key, this.count = 6, this.itemHeight = 72});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      itemCount: count,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (_, _) => SkeletonBox(height: itemHeight, radius: 20),
    );
  }
}

/// Four card suits hopping in turn (replaces bare CircularProgressIndicator).
class AppLoader extends StatelessWidget {
  const AppLoader({super.key});

  static const _suits = [
    ('♠', AppTheme.grape),
    ('♥', AppTheme.pink),
    ('♦', AppTheme.yellow),
    ('♣', AppTheme.mint),
  ];

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < _suits.length; i++)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Container(
                width: 34,
                height: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: _suits[i].$2,
                  shape: BoxShape.circle,
                  border: Border.all(color: context.outline, width: 2),
                ),
                child: Text(
                  _suits[i].$1,
                  style: const TextStyle(
                    fontSize: 18,
                    height: 1.1,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.lightOutline,
                  ),
                ),
              )
                  .animate(onPlay: (c) => c.repeat(), delay: (i * 140).ms)
                  .moveY(begin: 0, end: -12, duration: 280.ms, curve: Curves.easeOut)
                  .then()
                  .moveY(begin: 0, end: 12, duration: 280.ms, curve: Curves.easeIn)
                  .then(delay: 400.ms),
            ),
        ],
      ),
    );
  }
}

/// Friendly empty / error state: big emoji, title, optional action.
class EmptyState extends StatelessWidget {
  final String emoji;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.emoji,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 64))
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .moveY(begin: 0, end: -8, duration: 900.ms, curve: Curves.easeInOut)
                .rotate(begin: -0.02, end: 0.02, duration: 900.ms, curve: Curves.easeInOut),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            if (message != null) ...[
              const SizedBox(height: 6),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: TextStyle(color: context.ink60, height: 1.4),
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
              PopButton(
                label: actionLabel!,
                onPressed: onAction,
                expand: false,
                height: 50,
              ),
            ],
          ],
        ).animate().fadeIn(duration: AppTheme.normal).scaleXY(
              begin: 0.9,
              end: 1,
              duration: AppTheme.slow,
              curve: AppTheme.bounce,
            ),
      ),
    );
  }
}

/// Standard card surface: rounded, solid outline and hard shadow.
BoxDecoration cardDecoration(BuildContext context, {Color? color, Color? glow}) {
  return BoxDecoration(
    color: color ?? context.panel,
    borderRadius: BorderRadius.circular(20),
    border: Border.all(color: context.outline, width: 2),
    boxShadow: context.popShadow,
  );
}

/// Text that scales/fades to its new value whenever [text] changes
/// (pot totals, counters).
class TickText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;

  const TickText(this.text, {super.key, this.style, this.textAlign});

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: AppTheme.normal,
      switchInCurve: AppTheme.bounce,
      transitionBuilder: (child, anim) => FadeTransition(
        opacity: anim,
        child: ScaleTransition(
          scale: Tween(begin: 0.8, end: 1.0).animate(anim),
          child: child,
        ),
      ),
      child: Text(text, key: ValueKey(text), style: style, textAlign: textAlign),
    );
  }
}

/// Friendly full-area error. Never shows the raw exception text (that is only
/// logged in debug builds); instead it picks a message from what went wrong.
class ErrorState extends StatelessWidget {
  final Object? error;
  final VoidCallback? onRetry;

  const ErrorState({super.key, required this.error, this.onRetry});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final raw = '$error';
    if (kDebugMode) debugPrint('ErrorState: $raw');

    final String emoji, title, message;
    if (RegExp(r'SocketException|ClientException|Failed host lookup|TimeoutException|Connection|Network')
        .hasMatch(raw)) {
      (emoji, title, message) = ('📡', l.errorNetworkTitle, l.errorNetworkMessage);
    } else if (raw.contains('ApiException(404)')) {
      (emoji, title, message) = ('🔍', l.errorNotFoundTitle, l.errorNotFoundMessage);
    } else if (RegExp(r'ApiException\(5\d\d\)').hasMatch(raw)) {
      (emoji, title, message) = ('🛠️', l.errorServerTitle, l.errorServerMessage);
    } else {
      (emoji, title, message) = ('🙈', l.errorGenericTitle, l.errorGenericMessage);
    }

    return EmptyState(
      emoji: emoji,
      title: title,
      message: message,
      actionLabel: onRetry == null ? null : l.retry,
      onAction: onRetry,
    );
  }
}
