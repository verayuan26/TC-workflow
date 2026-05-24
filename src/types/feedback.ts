export type SuggestedContentUse =
  | 'wechat_article'
  | 'seo_article'
  | 'landing_page'
  | 'video_script'
  | 'vk_post'
  | 'internal_only';

export type StoryPrivacyLevel = 'public_safe' | 'needs_masking' | 'internal_only';
export type StoryUsagePermission = 'approved' | 'pending' | 'rejected';
