/**
 * @blorkfield/blork-tabs
 * A framework-agnostic tab/panel management system with snapping and docking
 *
 * @example
 * ```typescript
 * import { TabManager } from '@blorkfield/blork-tabs';
 * import '@blorkfield/blork-tabs/styles.css';
 *
 * const manager = new TabManager({
 *   snapThreshold: 50,
 *   panelGap: 0,
 * });
 *
 * // Create panels programmatically
 * manager.addPanel({
 *   id: 'settings',
 *   title: 'Settings',
 *   content: '<div>Settings content</div>',
 * });
 *
 * // Or register existing DOM elements
 * manager.registerPanel('my-panel', document.getElementById('my-panel'), {
 *   dragHandle: document.getElementById('my-panel-header'),
 * });
 *
 * // Set up snap chains
 * manager.createSnapChain(['panel1', 'panel2', 'panel3']);
 *
 * // Listen to events
 * manager.on('snap:panel', ({ movingPanels, targetPanel }) => {
 *   console.log('Panels snapped!');
 * });
 * ```
 */

// Main class export
export { TabManager } from './TabManager';

// Sub-module exports for advanced usage
export { AnchorManager, getDefaultAnchorConfigs, createPresetAnchor } from './AnchorManager';
export { DragManager } from './DragManager';
export { SnapPreview } from './SnapPreview';
export {
  createPanelElement,
  createPanelState,
  toggleCollapse,
  setPanelPosition,
  getPanelPosition,
  getPanelDimensions,
  setPanelZIndex,
  getDefaultZIndex,
  getDragZIndex,
} from './Panel';
export {
  getConnectedGroup,
  detachFromGroup,
  findSnapTarget,
  snapPanelsToTarget,
  updateSnappedPositions,
  getLeftmostPanel,
  getRightmostPanel,
  areInSameChain,
  snapPanels,
  unsnap,
} from './SnapChain';

// Type exports
export type {
  // Configuration
  TabManagerConfig,
  ResolvedTabManagerConfig,
  PanelConfig,
  AnchorConfig,
  AnchorPreset,

  // State
  PanelState,
  DragState,
  DragMode,
  AnchorState,

  // Results
  SnapTarget,
  SnapSide,
  AnchorSnapResult,
  Position,
  Bounds,

  // Events
  TabManagerEvents,
  PanelAddedEvent,
  PanelRemovedEvent,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  PanelSnapEvent,
  AnchorSnapEvent,
  PanelDetachedEvent,
  PanelCollapseEvent,
  EventListener,

  // CSS
  CSSClasses,
} from './types';
