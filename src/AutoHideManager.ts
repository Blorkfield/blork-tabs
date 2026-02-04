/**
 * @blorkfield/blork-tabs - AutoHideManager
 * Manages auto-hide behavior for panels based on user activity
 */

import type { PanelState, CSSClasses } from './types';
import { showPanel, hidePanel } from './Panel';

export interface AutoHideCallbacks {
  onShow?: (panel: PanelState, trigger: 'activity' | 'api') => void;
  onHide?: (panel: PanelState, trigger: 'timeout' | 'api') => void;
}

/**
 * Manages auto-hide functionality for panels
 */
export class AutoHideManager {
  private panels: Map<string, PanelState>;
  private classes: CSSClasses;
  private callbacks: AutoHideCallbacks;
  private hideTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private boundActivityHandler: () => void;
  private listenersAttached = false;

  constructor(
    panels: Map<string, PanelState>,
    classes: CSSClasses,
    callbacks: AutoHideCallbacks
  ) {
    this.panels = panels;
    this.classes = classes;
    this.callbacks = callbacks;
    this.boundActivityHandler = this.handleActivity.bind(this);
  }

  /**
   * Attach activity listeners to document
   */
  private attachListeners(): void {
    if (this.listenersAttached) return;
    document.addEventListener('mousemove', this.boundActivityHandler);
    document.addEventListener('mousedown', this.boundActivityHandler);
    document.addEventListener('keydown', this.boundActivityHandler);
    this.listenersAttached = true;
  }

  /**
   * Handle user activity - show hidden panels and reset timers
   */
  private handleActivity(): void {
    for (const panel of this.panels.values()) {
      // Only process panels that participate in auto-hide
      if (panel.resolvedAutoHideDelay !== undefined || panel.isHidden) {
        this.show(panel, 'activity');
        if (panel.resolvedAutoHideDelay !== undefined) {
          this.scheduleHide(panel);
        }
      }
    }
  }

  /**
   * Schedule a panel to hide after its delay
   */
  private scheduleHide(panel: PanelState): void {
    this.clearTimer(panel.id);
    if (panel.resolvedAutoHideDelay === undefined) return;

    const timer = setTimeout(() => {
      this.hide(panel, 'timeout');
    }, panel.resolvedAutoHideDelay);
    this.hideTimers.set(panel.id, timer);
  }

  /**
   * Clear hide timer for a panel
   */
  private clearTimer(panelId: string): void {
    const timer = this.hideTimers.get(panelId);
    if (timer) {
      clearTimeout(timer);
      this.hideTimers.delete(panelId);
    }
  }

  /**
   * Show a panel
   */
  show(panel: PanelState, trigger: 'activity' | 'api'): void {
    if (!panel.isHidden) return;
    showPanel(panel, this.classes);
    this.callbacks.onShow?.(panel, trigger);
  }

  /**
   * Hide a panel
   */
  hide(panel: PanelState, trigger: 'timeout' | 'api'): void {
    if (panel.isHidden) return;
    hidePanel(panel, this.classes);
    this.callbacks.onHide?.(panel, trigger);
  }

  /**
   * Initialize a newly added panel's auto-hide state
   */
  initializePanel(panel: PanelState): void {
    // Attach listeners if this panel needs auto-hide
    if (panel.resolvedAutoHideDelay !== undefined || panel.isHidden) {
      this.attachListeners();
    }
    // Start hide timer if visible and has auto-hide
    if (!panel.isHidden && panel.resolvedAutoHideDelay !== undefined) {
      this.scheduleHide(panel);
    }
  }

  /**
   * Clean up when a panel is removed
   */
  cleanupPanel(panelId: string): void {
    this.clearTimer(panelId);
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    if (this.listenersAttached) {
      document.removeEventListener('mousemove', this.boundActivityHandler);
      document.removeEventListener('mousedown', this.boundActivityHandler);
      document.removeEventListener('keydown', this.boundActivityHandler);
    }
    for (const timer of this.hideTimers.values()) {
      clearTimeout(timer);
    }
    this.hideTimers.clear();
  }
}
