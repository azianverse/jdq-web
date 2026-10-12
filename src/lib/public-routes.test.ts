import { describe, expect, it } from 'vitest';
import { isPublicPage } from './public-routes';

describe('wallet gate public pages', () => {
  it('lets anyone view the informational Trail, Affiliate, and Explore discovery pages', () => {
    expect(isPublicPage('/trail')).toBe(true);
    expect(isPublicPage('/affiliate')).toBe(true);
    expect(isPublicPage('/explore')).toBe(true);
  });

  it('continues to protect functional app routes', () => {
    expect(isPublicPage('/quests')).toBe(false);
    expect(isPublicPage('/profile')).toBe(false);
    expect(isPublicPage('/settings')).toBe(false);
  });
});
