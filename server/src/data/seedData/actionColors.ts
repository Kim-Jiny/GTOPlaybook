export interface ActionType {
  key: string;
  label: string;
  color: string;
}

export const ACTION_COLORS: Record<string, string> = {
  raise: '#D32F2F',
  '3bet': '#F57C00',
  '4bet': '#7B1FA2',
  '5bet': '#D50000',
  call: '#388E3C',
  fold: '#616161',
  allin: '#D50000',
  bet: '#1976D2',
  check: '#757575',
};

export const RFI_ACTIONS: ActionType[] = [
  { key: 'raise', label: 'Raise', color: ACTION_COLORS.raise },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const ISO_RAISE_ACTIONS: ActionType[] = [
  { key: 'raise', label: 'Iso Raise', color: ACTION_COLORS.raise },
  { key: 'call', label: 'Overlimp', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const SQUEEZE_ACTIONS: ActionType[] = [
  { key: '3bet', label: 'Squeeze', color: ACTION_COLORS['3bet'] },
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const COLD_CALL_ACTIONS: ActionType[] = [
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const LIMPED_POT_ACTIONS: ActionType[] = [
  { key: 'raise', label: 'Raise', color: ACTION_COLORS.raise },
  { key: 'check', label: 'Check', color: ACTION_COLORS.check },
];

export const FACING_3BET_ACTIONS: ActionType[] = [
  { key: '4bet', label: '4bet', color: ACTION_COLORS['4bet'] },
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const THREE_BET_ACTIONS: ActionType[] = [
  { key: '3bet', label: '3bet', color: ACTION_COLORS['3bet'] },
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const BB_DEFEND_ACTIONS: ActionType[] = [
  { key: '3bet', label: '3bet', color: ACTION_COLORS['3bet'] },
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const SB_DEFEND_ACTIONS: ActionType[] = [
  { key: '3bet', label: '3bet', color: ACTION_COLORS['3bet'] },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const FACING_4BET_ACTIONS: ActionType[] = [
  { key: '5bet', label: '5bet', color: ACTION_COLORS['5bet'] },
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const POSTFLOP_CBET_ACTIONS: ActionType[] = [
  { key: 'bet', label: 'Bet', color: ACTION_COLORS.bet },
  { key: 'check', label: 'Check', color: ACTION_COLORS.check },
];

export const PUSH_FOLD_ACTIONS: ActionType[] = [
  { key: 'allin', label: 'All-in', color: ACTION_COLORS.allin },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const CALL_SHOVE_ACTIONS: ActionType[] = [
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

// Facing 3bet jam-or-fold (15bb — no calling range)
export const FACING_3BET_JAM_ACTIONS: ActionType[] = [
  { key: 'allin', label: 'All-in', color: ACTION_COLORS.allin },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

// 3bet or fold only (25bb 3bet spots, no calling range)
export const THREE_BET_FOLD_ACTIONS: ActionType[] = [
  { key: '3bet', label: '3bet', color: ACTION_COLORS['3bet'] },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

// Combined actions for medium stacks (raise + jam + fold)
export const RFI_JAM_ACTIONS: ActionType[] = [
  { key: 'raise', label: 'Raise', color: ACTION_COLORS.raise },
  { key: 'allin', label: 'All-in', color: ACTION_COLORS.allin },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

// BB defend with jam option
export const BB_DEFEND_JAM_ACTIONS: ActionType[] = [
  { key: '3bet', label: '3bet', color: ACTION_COLORS['3bet'] },
  { key: 'allin', label: 'All-in', color: ACTION_COLORS.allin },
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

// SB defend with jam option
export const SB_DEFEND_JAM_ACTIONS: ActionType[] = [
  { key: '3bet', label: '3bet', color: ACTION_COLORS['3bet'] },
  { key: 'allin', label: 'All-in', color: ACTION_COLORS.allin },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];
