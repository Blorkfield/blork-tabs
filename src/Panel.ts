/**
 * @blorkfield/blork-tabs - Panel
 * Individual panel component with collapse/expand functionality
 */

import type {
  PanelConfig,
  PanelState,
  CSSClasses,
  ResolvedTabManagerConfig,
} from './types';

/**
 * Creates the default panel DOM structure
 */
export function createPanelElement(
  config: PanelConfig,
  classes: CSSClasses
): {
  element: HTMLDivElement;
  dragHandle: HTMLDivElement;
  collapseButton: HTMLButtonElement | null;
  contentWrapper: HTMLDivElement;
  detachGrip: HTMLDivElement | null;
} {
  const element = document.createElement('div');
  element.className = classes.panel;
  element.id = `${config.id}-panel`;
  element.style.width = `${config.width ?? 300}px`;
  element.style.zIndex = `${config.zIndex ?? 1000}`;

  // Header
  const header = document.createElement('div');
  header.className = classes.panelHeader;
  header.id = `${config.id}-header`;

  // Detach grip (if detachable)
  let detachGrip: HTMLDivElement | null = null;
  if (config.detachable !== false) {
    detachGrip = document.createElement('div');
    detachGrip.className = classes.detachGrip;
    detachGrip.id = `${config.id}-detach-grip`;
    header.appendChild(detachGrip);
  }

  // Title
  if (config.title) {
    const title = document.createElement('span');
    title.className = classes.panelTitle;
    title.textContent = config.title;
    header.appendChild(title);
  }

  // Collapse button (if collapsible)
  let collapseButton: HTMLButtonElement | null = null;
  if (config.collapsible !== false) {
    collapseButton = document.createElement('button');
    collapseButton.className = classes.collapseButton;
    collapseButton.id = `${config.id}-collapse-btn`;
    collapseButton.textContent = config.startCollapsed !== false ? '+' : '−';
    header.appendChild(collapseButton);
  }

  element.appendChild(header);

  // Content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = classes.panelContent;
  contentWrapper.id = `${config.id}-content`;
  if (config.startCollapsed !== false) {
    contentWrapper.classList.add(classes.panelContentCollapsed);
  }

  // Add content if provided
  if (config.content) {
    if (typeof config.content === 'string') {
      contentWrapper.innerHTML = config.content;
    } else {
      contentWrapper.appendChild(config.content);
    }
  }

  element.appendChild(contentWrapper);

  return {
    element,
    dragHandle: header,
    collapseButton,
    contentWrapper,
    detachGrip,
  };
}

/**
 * Creates a PanelState from config, using existing elements or creating new ones
 */
export function createPanelState(
  config: PanelConfig,
  classes: CSSClasses
): PanelState {
  let element: HTMLDivElement;
  let dragHandle: HTMLDivElement;
  let collapseButton: HTMLButtonElement | null;
  let contentWrapper: HTMLDivElement;
  let detachGrip: HTMLDivElement | null;

  if (config.element) {
    // Use existing DOM elements
    element = config.element;
    dragHandle = config.dragHandle ?? (element.querySelector(`.${classes.panelHeader}`) as HTMLDivElement);
    collapseButton = config.collapseButton ?? (element.querySelector(`.${classes.collapseButton}`) as HTMLButtonElement | null);
    contentWrapper = config.contentWrapper ?? (element.querySelector(`.${classes.panelContent}`) as HTMLDivElement);
    detachGrip = config.detachGrip ?? (element.querySelector(`.${classes.detachGrip}`) as HTMLDivElement | null);
  } else {
    // Create new DOM structure
    const created = createPanelElement(config, classes);
    element = created.element;
    dragHandle = created.dragHandle;
    collapseButton = created.collapseButton;
    contentWrapper = created.contentWrapper;
    detachGrip = created.detachGrip;
  }

  return {
    id: config.id,
    element,
    dragHandle,
    collapseButton,
    contentWrapper,
    detachGrip,
    isCollapsed: config.startCollapsed !== false,
    snappedTo: null,
    snappedFrom: null,
    config,
  };
}

/**
 * Toggle panel collapse state
 */
export function toggleCollapse(
  state: PanelState,
  classes: CSSClasses,
  collapsed?: boolean
): boolean {
  const newState = collapsed ?? !state.isCollapsed;
  state.isCollapsed = newState;

  if (newState) {
    state.contentWrapper.classList.add(classes.panelContentCollapsed);
  } else {
    state.contentWrapper.classList.remove(classes.panelContentCollapsed);
  }

  if (state.collapseButton) {
    state.collapseButton.textContent = newState ? '+' : '−';
  }

  return newState;
}

/**
 * Set panel position
 */
export function setPanelPosition(
  state: PanelState,
  x: number,
  y: number
): void {
  state.element.style.left = `${x}px`;
  state.element.style.top = `${y}px`;
  state.element.style.right = 'auto';
}

/**
 * Get panel position from DOM
 */
export function getPanelPosition(state: PanelState): { x: number; y: number } {
  const rect = state.element.getBoundingClientRect();
  return { x: rect.left, y: rect.top };
}

/**
 * Get panel dimensions
 */
export function getPanelDimensions(state: PanelState): { width: number; height: number } {
  return {
    width: state.element.offsetWidth,
    height: state.element.offsetHeight,
  };
}

/**
 * Set panel z-index
 */
export function setPanelZIndex(state: PanelState, zIndex: number): void {
  state.element.style.zIndex = `${zIndex}`;
}

/**
 * Get default z-index for panel
 */
export function getDefaultZIndex(state: PanelState): number {
  return state.config.zIndex ?? 1000;
}

/**
 * Get drag z-index for panel
 */
export function getDragZIndex(state: PanelState): number {
  return state.config.dragZIndex ?? 1002;
}
