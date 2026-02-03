/**
 * @blorkfield/blork-tabs - TabManager
 * Main orchestrator for the tab/panel management system
 */

import type {
  TabManagerConfig,
  ResolvedTabManagerConfig,
  PanelConfig,
  PanelState,
  AnchorConfig,
  AnchorState,
  AnchorPreset,
  CSSClasses,
  TabManagerEvents,
  EventListener,
  SnapTarget,
  AnchorSnapResult,
  DragState,
  Position,
} from './types';
import { createPanelState, toggleCollapse, setPanelPosition } from './Panel';
import { getConnectedGroup, detachFromGroup, updateSnappedPositions, snapPanels } from './SnapChain';
import { DragManager } from './DragManager';
import { AnchorManager } from './AnchorManager';
import { SnapPreview } from './SnapPreview';
import { AutoHideManager } from './AutoHideManager';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ResolvedTabManagerConfig = {
  snapThreshold: 50,
  panelGap: 0,
  panelMargin: 16,
  anchorThreshold: 80,
  defaultPanelWidth: 300,
  container: document.body,
  initializeDefaultAnchors: true,
  classPrefix: 'blork-tabs',
  startHidden: false,
  autoHideDelay: undefined,
};

/**
 * Generate CSS class names from prefix
 */
function generateClasses(prefix: string): CSSClasses {
  return {
    panel: `${prefix}-panel`,
    panelHeader: `${prefix}-header`,
    panelTitle: `${prefix}-title`,
    panelContent: `${prefix}-content`,
    panelContentCollapsed: `${prefix}-content-collapsed`,
    detachGrip: `${prefix}-detach-grip`,
    collapseButton: `${prefix}-collapse-btn`,
    snapPreview: `${prefix}-snap-preview`,
    snapPreviewVisible: `${prefix}-snap-preview-visible`,
    anchorIndicator: `${prefix}-anchor-indicator`,
    anchorIndicatorVisible: `${prefix}-anchor-indicator-visible`,
    anchorIndicatorActive: `${prefix}-anchor-indicator-active`,
    dragging: `${prefix}-dragging`,
    panelHidden: `${prefix}-panel-hidden`,
  };
}

/**
 * Main TabManager class - orchestrates all panel, snap, and anchor functionality
 */
export class TabManager {
  private config: ResolvedTabManagerConfig;
  private classes: CSSClasses;
  private panels: Map<string, PanelState> = new Map();
  private dragManager: DragManager;
  private anchorManager: AnchorManager;
  private snapPreview: SnapPreview;
  private autoHideManager: AutoHideManager;
  private eventListeners: Map<string, Set<EventListener<unknown>>> = new Map();

  constructor(userConfig: TabManagerConfig = {}) {
    // Merge user config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      container: userConfig.container ?? document.body,
    };

    this.classes = generateClasses(this.config.classPrefix);

    // Initialize managers
    this.anchorManager = new AnchorManager(this.config, this.classes);
    this.snapPreview = new SnapPreview(
      this.config.container,
      this.classes,
      this.panels
    );
    this.dragManager = new DragManager(
      this.panels,
      this.config,
      {
        onDragStart: this.handleDragStart.bind(this),
        onDragMove: this.handleDragMove.bind(this),
        onDragEnd: this.handleDragEnd.bind(this),
        findAnchorTarget: (panels) => this.anchorManager.findNearestAnchor(panels),
      }
    );

    this.autoHideManager = new AutoHideManager(
      this.panels,
      this.classes,
      {
        onShow: (panel, trigger) => this.emit('panel:show', { panel, trigger }),
        onHide: (panel, trigger) => this.emit('panel:hide', { panel, trigger }),
      }
    );

    // Initialize default anchors if configured
    if (this.config.initializeDefaultAnchors) {
      this.anchorManager.addDefaultAnchors();
    }
  }

  // ==================== Panel Management ====================

  /**
   * Add a new panel
   */
  addPanel(panelConfig: PanelConfig): PanelState {
    const state = createPanelState(panelConfig, this.classes, {
      startHidden: this.config.startHidden,
      autoHideDelay: this.config.autoHideDelay,
    });

    // Add to container if new element
    if (!panelConfig.element && !this.config.container.contains(state.element)) {
      this.config.container.appendChild(state.element);
    }

    // Set up event handlers
    this.setupPanelEvents(state);

    // Store panel
    this.panels.set(state.id, state);

    // Set initial position if provided
    if (panelConfig.initialPosition) {
      setPanelPosition(state, panelConfig.initialPosition.x, panelConfig.initialPosition.y);
    }

    // Initialize auto-hide state
    this.autoHideManager.initializePanel(state);

    this.emit('panel:added', { panel: state });

    return state;
  }

  /**
   * Register an existing panel element
   */
  registerPanel(
    id: string,
    element: HTMLDivElement,
    options: {
      dragHandle?: HTMLDivElement;
      collapseButton?: HTMLButtonElement;
      contentWrapper?: HTMLDivElement;
      detachGrip?: HTMLDivElement;
      startCollapsed?: boolean;
    } = {}
  ): PanelState {
    return this.addPanel({
      id,
      element,
      dragHandle: options.dragHandle,
      collapseButton: options.collapseButton,
      contentWrapper: options.contentWrapper,
      detachGrip: options.detachGrip,
      startCollapsed: options.startCollapsed,
    });
  }

  /**
   * Remove a panel
   */
  removePanel(id: string): boolean {
    const panel = this.panels.get(id);
    if (!panel) return false;

    // Clean up auto-hide timer
    this.autoHideManager.cleanupPanel(id);

    // Detach from any snap chain
    detachFromGroup(panel, this.panels);

    // Remove from DOM if we created it
    if (!panel.config.element) {
      panel.element.remove();
    }

    this.panels.delete(id);
    this.emit('panel:removed', { panelId: id });

    return true;
  }

  /**
   * Get a panel by ID
   */
  getPanel(id: string): PanelState | undefined {
    return this.panels.get(id);
  }

  /**
   * Get all panels
   */
  getAllPanels(): PanelState[] {
    return Array.from(this.panels.values());
  }

  /**
   * Set up event handlers for a panel
   */
  private setupPanelEvents(state: PanelState): void {
    // Collapse button
    if (state.collapseButton) {
      state.collapseButton.addEventListener('click', () => {
        const newState = toggleCollapse(state, this.classes);
        updateSnappedPositions(this.panels, this.config);
        this.emit('panel:collapse', { panel: state, isCollapsed: newState });
      });
    }

    // Detach grip - single panel drag
    if (state.detachGrip) {
      state.detachGrip.addEventListener('mousedown', (e) => {
        this.dragManager.startDrag(e, state, 'single');
      });
    }

    // Main drag handle - group drag
    state.dragHandle.addEventListener('mousedown', (e) => {
      // Ignore if clicking on collapse button or detach grip
      if (
        e.target === state.collapseButton ||
        e.target === state.detachGrip
      ) {
        return;
      }
      this.dragManager.startDrag(e, state, 'group');
    });
  }

  // ==================== Snap Chain Management ====================

  /**
   * Get all panels in the same snap chain as the given panel
   */
  getSnapChain(panelId: string): PanelState[] {
    const panel = this.panels.get(panelId);
    if (!panel) return [];
    return getConnectedGroup(panel, this.panels);
  }

  /**
   * Manually snap two panels together
   */
  snap(leftPanelId: string, rightPanelId: string): boolean {
    const leftPanel = this.panels.get(leftPanelId);
    const rightPanel = this.panels.get(rightPanelId);

    if (!leftPanel || !rightPanel) return false;

    snapPanels(leftPanel, rightPanel);
    updateSnappedPositions(this.panels, this.config);

    return true;
  }

  /**
   * Detach a panel from its snap chain
   */
  detach(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) return false;

    const previousGroup = getConnectedGroup(panel, this.panels);
    detachFromGroup(panel, this.panels);

    this.emit('panel:detached', { panel, previousGroup });

    return true;
  }

  /**
   * Update snapped positions (call after collapse/expand or resize)
   */
  updatePositions(): void {
    updateSnappedPositions(this.panels, this.config);
  }

  // ==================== Anchor Management ====================

  /**
   * Add a custom anchor
   */
  addAnchor(config: AnchorConfig): AnchorState {
    return this.anchorManager.addAnchor(config);
  }

  /**
   * Add a preset anchor
   */
  addPresetAnchor(preset: AnchorPreset): AnchorState {
    return this.anchorManager.addPresetAnchor(preset);
  }

  /**
   * Remove an anchor
   */
  removeAnchor(id: string): boolean {
    return this.anchorManager.removeAnchor(id);
  }

  /**
   * Get all anchors
   */
  getAnchors(): AnchorState[] {
    return this.anchorManager.getAnchors();
  }

  // ==================== Auto-Hide ====================

  /**
   * Show a hidden panel
   */
  show(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) return false;
    this.autoHideManager.show(panel, 'api');
    return true;
  }

  /**
   * Hide a panel
   */
  hide(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) return false;
    this.autoHideManager.hide(panel, 'api');
    return true;
  }

  /**
   * Check if a panel is hidden
   */
  isHidden(panelId: string): boolean {
    return this.panels.get(panelId)?.isHidden ?? false;
  }

  // ==================== Drag Callbacks ====================

  private handleDragStart(state: DragState): void {
    this.anchorManager.showIndicators(null);
    this.emit('drag:start', {
      panel: state.grabbedPanel,
      mode: state.mode,
      movingPanels: state.movingPanels,
    });
  }

  private handleDragMove(
    state: DragState,
    position: Position,
    snapTarget: SnapTarget | null,
    anchorResult: AnchorSnapResult | null
  ): void {
    // Update snap preview
    this.snapPreview.update(snapTarget);

    // Update anchor indicators
    this.anchorManager.showIndicators(anchorResult?.anchor ?? null);

    this.emit('drag:move', {
      panel: state.grabbedPanel,
      position,
      snapTarget,
      anchorTarget: anchorResult,
    });
  }

  private handleDragEnd(
    state: DragState,
    snapTarget: SnapTarget | null,
    anchorResult: AnchorSnapResult | null
  ): void {
    this.snapPreview.hide();
    this.anchorManager.hideIndicators();

    const rect = state.grabbedPanel.element.getBoundingClientRect();

    if (snapTarget) {
      const targetPanel = this.panels.get(snapTarget.targetId);
      if (targetPanel) {
        this.emit('snap:panel', {
          movingPanels: state.movingPanels,
          targetPanel,
          side: snapTarget.side,
        });
      }
    } else if (anchorResult) {
      this.emit('snap:anchor', {
        movingPanels: state.movingPanels,
        anchor: anchorResult.anchor,
      });
    }

    this.emit('drag:end', {
      panel: state.grabbedPanel,
      finalPosition: { x: rect.left, y: rect.top },
      snappedToPanel: snapTarget !== null,
      snappedToAnchor: anchorResult !== null,
    });
  }

  // ==================== Event System ====================

  /**
   * Subscribe to an event
   */
  on<K extends keyof TabManagerEvents>(
    event: K,
    listener: EventListener<TabManagerEvents[K]>
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener as EventListener<unknown>);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof TabManagerEvents>(
    event: K,
    listener: EventListener<TabManagerEvents[K]>
  ): void {
    this.eventListeners.get(event)?.delete(listener as EventListener<unknown>);
  }

  /**
   * Emit an event
   */
  private emit<K extends keyof TabManagerEvents>(
    event: K,
    data: TabManagerEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }

  // ==================== Positioning ====================

  /**
   * Position panels in a row from right edge
   */
  positionPanelsFromRight(panelIds: string[], gap = 0): void {
    let rightEdge = window.innerWidth - this.config.panelMargin;

    for (const id of panelIds) {
      const state = this.panels.get(id);
      if (!state) continue;

      const width = state.element.offsetWidth;
      setPanelPosition(state, rightEdge - width, this.config.panelMargin);
      rightEdge -= width + gap;
    }
  }

  /**
   * Position panels in a row from left edge
   */
  positionPanelsFromLeft(panelIds: string[], gap = 0): void {
    let leftEdge = this.config.panelMargin;

    for (const id of panelIds) {
      const state = this.panels.get(id);
      if (!state) continue;

      setPanelPosition(state, leftEdge, this.config.panelMargin);
      leftEdge += state.element.offsetWidth + gap;
    }
  }

  /**
   * Set up initial snap chain for a list of panels (left to right)
   */
  createSnapChain(panelIds: string[]): void {
    for (let i = 0; i < panelIds.length - 1; i++) {
      const leftPanel = this.panels.get(panelIds[i]);
      const rightPanel = this.panels.get(panelIds[i + 1]);

      if (leftPanel && rightPanel) {
        snapPanels(leftPanel, rightPanel);
      }
    }
  }

  // ==================== Configuration ====================

  /**
   * Get the current configuration
   */
  getConfig(): ResolvedTabManagerConfig {
    return { ...this.config };
  }

  /**
   * Get the CSS classes used
   */
  getClasses(): CSSClasses {
    return { ...this.classes };
  }

  /**
   * Check if dragging is currently active
   */
  isDragging(): boolean {
    return this.dragManager.isActive();
  }

  // ==================== Cleanup ====================

  /**
   * Destroy the TabManager and clean up resources
   */
  destroy(): void {
    this.dragManager.destroy();
    this.anchorManager.destroy();
    this.snapPreview.destroy();
    this.autoHideManager.destroy();

    // Remove panels we created
    for (const panel of this.panels.values()) {
      if (!panel.config.element) {
        panel.element.remove();
      }
    }

    this.panels.clear();
    this.eventListeners.clear();
  }
}
