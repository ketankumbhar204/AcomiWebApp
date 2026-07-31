export type OccupancyWizardMode =
  | 'ALLOCATE'
  | 'RESERVE'
  | 'MOVE_IN'
  | 'TRANSFER'
  | 'VACATE';

export type OccupancyWizardStep =
  | 'member'
  | 'target'
  | 'reserve_dates'
  | 'transfer_current'
  | 'contract'
  | 'review'
  | 'vacate_confirm';
