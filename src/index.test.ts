import { describe, it, expect } from 'vitest';
import { TabManager } from './index';

describe('TabManager', () => {
  it('exports TabManager class', () => {
    expect(TabManager).toBeDefined();
    expect(typeof TabManager).toBe('function');
  });
});
