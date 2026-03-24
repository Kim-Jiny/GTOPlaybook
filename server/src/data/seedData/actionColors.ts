export interface ActionType {
  key: string;
  label: string;
  color: string;
}

export const ACTION_COLORS: Record<string, string> = {
  raise: '#D32F2F',
  '3bet': '#F57C00',
  '4bet': '#7B1FA2',
  call: '#388E3C',
  fold: '#616161',
  squeeze: '#E64A19',
  allin: '#D50000',
};

export const RFI_ACTIONS: ActionType[] = [
  { key: 'raise', label: 'Raise', color: ACTION_COLORS.raise },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
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
  { key: '5bet', label: '5bet', color: '#D50000' },
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const POSTFLOP_CBET_ACTIONS: ActionType[] = [
  { key: 'bet', label: 'Bet', color: '#1976D2' },
  { key: 'check', label: 'Check', color: '#757575' },
];

export const PUSH_FOLD_ACTIONS: ActionType[] = [
  { key: 'allin', label: 'All-in', color: ACTION_COLORS.allin },
  { key: 'fold', label: 'Fold', color: ACTION_COLORS.fold },
];

export const CALL_SHOVE_ACTIONS: ActionType[] = [
  { key: 'call', label: 'Call', color: ACTION_COLORS.call },
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
