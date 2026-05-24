export type ReviewStatus =
  | 'pending'
  | 'approved'
  | 'revise_required'
  | 'rejected'
  | 'internal_only'
  | 'masking_required'
  | 'boss_confirm_required';
