/**
 * @blorkfield/blork-tabs - Type Definitions
 * A framework-agnostic tab/panel management system with snapping and docking
 */

// ==================== Configuration Types ====================

/**
 * Configuration for initializing the TabManager
 */
export interface TabManagerConfig {
  /** Distance threshold for panel-to-panel snapping (default: 50) */
  snapThreshold?: number;
  /** Gap between snapped panels (default: 0) */
  panelGap?: number;
  /** Margin from window edges (default: 16) */
  panelMargin?: number;
  /** Distance threshold for anchor snapping (default: 80) */
  anchorThreshold?: number;
  /** Default panel width for anchor calculations (default: 300) */
  defaultPanelWidth?: number;
  /** Container element for panels (default: document.body) */
  container?: HTMLElement;
  /** Whether to automatically initialize default anchors (default: true) */
  initializeDefaultAnchors?: boolean;
  /** Custom CSS class prefix (default: 'blork-tabs') */
  classPrefix?: string;
  /** Whether panels start hidden (default: false) */
  startHidden?: boolean;
  /** Milliseconds before auto-hiding on inactivity (undefined = no auto-hide) */
  autoHideDelay?: number;
}

/**
 * Resolved configuration with all defaults applied
 */
export interface ResolvedTabManagerConfig {
  snapThreshold: number;
  panelGap: number;
  panelMargin: number;
  anchorThreshold: number;
  defaultPanelWidth: number;
  container: HTMLElement;
  initializeDefaultAnchors: boolean;
  classPrefix: string;
  startHidden: boolean;
  autoHideDelay: number | undefined;
}

/**
 * Configuration for creating a new panel
 */
export interface PanelConfig {
  /** Unique identifier for the panel */
  id: string;
  /** Panel title displayed in header */
  title?: string;
  /** Initial width (default: 300) */
  width?: number;
  /** Initial collapsed state (default: true) */
  startCollapsed?: boolean;
  /** Initial position (optional - will be auto-positioned if not provided) */
  initialPosition?: { x: number; y: number };
  /** Content element or HTML string */
  content?: HTMLElement | string;
  /** Custom panel element (for existing DOM panels) */
  element?: HTMLDivElement;
  /** Custom drag handle element */
  dragHandle?: HTMLDivElement;
  /** Custom collapse button element */
  collapseButton?: HTMLButtonElement;
  /** Custom content wrapper element */
  contentWrapper?: HTMLDivElement;
  /** Custom detach grip element */
  detachGrip?: HTMLDivElement;
  /** Whether panel can be collapsed (default: true) */
  collapsible?: boolean;
  /** Whether panel can be detached from group (default: true) */
  detachable?: boolean;
  /** Whether panel can be dragged (default: true) */
  draggable?: boolean;
  /** Z-index for panel (default: 1000) */
  zIndex?: number;
  /** Z-index when dragging (default: 1002) */
  dragZIndex?: number;
  /** Override global startHidden for this panel */
  startHidden?: boolean;
  /** Override global autoHideDelay for this panel (undefined = use global, 0 = disable) */
  autoHideDelay?: number;
}

/**
 * Configuration for anchor points
 */
export interface AnchorConfig {
  /** Unique identifier for the anchor */
  id: string;
  /** Function that returns the anchor position (allows dynamic positioning) */
  getPosition: () => Position;
  /** Whether to show visual indicator (default: true) */
  showIndicator?: boolean;
}

/**
 * Preset anchor positions
 */
export type AnchorPreset =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'center-left'
  | 'center-right';

// ==================== State Types ====================

/**
 * Current state of a panel
 */
export interface PanelState {
  /** Unique panel identifier */
  id: string;
  /** DOM element for the panel */
  element: HTMLDivElement;
  /** Drag handle element */
  dragHandle: HTMLDivElement;
  /** Collapse button element (if collapsible) */
  collapseButton: HTMLButtonElement | null;
  /** Content wrapper element */
  contentWrapper: HTMLDivElement;
  /** Detach grip element (if detachable) */
  detachGrip: HTMLDivElement | null;
  /** Whether panel is currently collapsed */
  isCollapsed: boolean;
  /** ID of panel this is snapped to on its right (outgoing link) */
  snappedTo: string | null;
  /** ID of panel snapped to this on its left (incoming link) */
  snappedFrom: string | null;
  /** Panel configuration */
  config: PanelConfig;
  /** Whether panel is currently hidden via auto-hide */
  isHidden: boolean;
  /** Resolved auto-hide delay for this panel */
  resolvedAutoHideDelay: number | undefined;
}

/**
 * Current drag operation state
 */
export interface DragState {
  /** Panel that initiated the drag */
  grabbedPanel: PanelState;
  /** Mouse offset from panel left edge */
  offsetX: number;
  /** Mouse offset from panel top edge */
  offsetY: number;
  /** Initial positions of all connected panels */
  initialGroupPositions: Map<string, Position>;
  /** Panels being moved in this drag operation */
  movingPanels: PanelState[];
  /** Drag mode - single panel or entire group */
  mode: DragMode;
}

/**
 * Drag mode determines what gets moved
 */
export type DragMode = 'single' | 'group';

/**
 * Anchor state including visual indicator
 */
export interface AnchorState {
  /** Anchor configuration */
  config: AnchorConfig;
  /** Visual indicator element */
  indicator: HTMLDivElement | null;
}

// ==================== Result Types ====================

/**
 * Result of snap target detection
 */
export interface SnapTarget {
  /** ID of the target panel */
  targetId: string;
  /** Which side of target to snap to */
  side: SnapSide;
  /** X position for snap */
  x: number;
  /** Y position for snap */
  y: number;
}

/**
 * Side of panel to snap to
 */
export type SnapSide = 'left' | 'right';

/**
 * Result of anchor snap detection
 */
export interface AnchorSnapResult {
  /** The matched anchor */
  anchor: AnchorState;
  /** Index of panel in group that docks to anchor */
  dockPanelIndex: number;
  /** Final positions for all panels in the group */
  positions: Position[];
}

/**
 * Simple x,y position
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Bounding rectangle
 */
export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

// ==================== Event Types ====================

/**
 * Events emitted by TabManager
 */
export interface TabManagerEvents {
  /** Fired when a panel is added */
  'panel:added': PanelAddedEvent;
  /** Fired when a panel is removed */
  'panel:removed': PanelRemovedEvent;
  /** Fired when a panel starts being dragged */
  'drag:start': DragStartEvent;
  /** Fired during drag movement */
  'drag:move': DragMoveEvent;
  /** Fired when drag ends */
  'drag:end': DragEndEvent;
  /** Fired when panels snap together */
  'snap:panel': PanelSnapEvent;
  /** Fired when panels snap to anchor */
  'snap:anchor': AnchorSnapEvent;
  /** Fired when a panel is detached from group */
  'panel:detached': PanelDetachedEvent;
  /** Fired when panel collapse state changes */
  'panel:collapse': PanelCollapseEvent;
  /** Fired when a panel becomes visible (auto-hide) */
  'panel:show': PanelShowEvent;
  /** Fired when a panel becomes hidden (auto-hide) */
  'panel:hide': PanelHideEvent;
}

export interface PanelAddedEvent {
  panel: PanelState;
}

export interface PanelRemovedEvent {
  panelId: string;
}

export interface DragStartEvent {
  panel: PanelState;
  mode: DragMode;
  movingPanels: PanelState[];
}

export interface DragMoveEvent {
  panel: PanelState;
  position: Position;
  snapTarget: SnapTarget | null;
  anchorTarget: AnchorSnapResult | null;
}

export interface DragEndEvent {
  panel: PanelState;
  finalPosition: Position;
  snappedToPanel: boolean;
  snappedToAnchor: boolean;
}

export interface PanelSnapEvent {
  movingPanels: PanelState[];
  targetPanel: PanelState;
  side: SnapSide;
}

export interface AnchorSnapEvent {
  movingPanels: PanelState[];
  anchor: AnchorState;
}

export interface PanelDetachedEvent {
  panel: PanelState;
  previousGroup: PanelState[];
}

export interface PanelCollapseEvent {
  panel: PanelState;
  isCollapsed: boolean;
}

export interface PanelShowEvent {
  panel: PanelState;
  trigger: 'activity' | 'api';
}

export interface PanelHideEvent {
  panel: PanelState;
  trigger: 'timeout' | 'api';
}

/**
 * Event listener function type
 */
export type EventListener<T> = (event: T) => void;

// ==================== CSS Class Names ====================

/**
 * CSS class names used by the library
 */
export interface CSSClasses {
  panel: string;
  panelHeader: string;
  panelTitle: string;
  panelContent: string;
  panelContentCollapsed: string;
  detachGrip: string;
  collapseButton: string;
  snapPreview: string;
  snapPreviewVisible: string;
  anchorIndicator: string;
  anchorIndicatorVisible: string;
  anchorIndicatorActive: string;
  dragging: string;
  panelHidden: string;
  debugLog: string;
  debugLogEntry: string;
  debugLogEntryInfo: string;
  debugLogEntryWarn: string;
  debugLogEntryError: string;
  debugLogName: string;
  debugLogData: string;
  debugLogTimestamp: string;
  debugClearButton: string;
}

// ==================== Debug Panel Types ====================

/**
 * Configuration for creating a debug panel
 */
export interface DebugPanelConfig extends Omit<PanelConfig, 'content'> {
  /** Maximum log entries before oldest are removed (default: 50) */
  maxEntries?: number;
  /** Show timestamps on entries (default: false) */
  showTimestamps?: boolean;
  /** Show clear button in header (default: true) */
  showClearButton?: boolean;
}

/**
 * Log level for debug entries
 */
export type DebugLogLevel = 'log' | 'info' | 'warn' | 'error';

/**
 * Interface for interacting with a debug panel
 */
export interface DebugPanel {
  /** Log an event (alias for info) */
  log(eventName: string, data?: Record<string, unknown>): void;
  /** Log an info event (blue) */
  info(eventName: string, data?: Record<string, unknown>): void;
  /** Log a warning event (yellow) */
  warn(eventName: string, data?: Record<string, unknown>): void;
  /** Log an error event (red) */
  error(eventName: string, data?: Record<string, unknown>): void;
  /** Clear all log entries */
  clear(): void;
  /** The underlying panel state */
  panel: PanelState;
}
