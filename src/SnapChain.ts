/**
 * @blorkfield/blork-tabs - SnapChain
 * Manages snap relationships between panels forming linked chains
 */

import type {
  PanelState,
  SnapTarget,
  SnapSide,
  ResolvedTabManagerConfig,
} from './types';

/**
 * Get all panels connected to a given panel (the entire snap chain)
 * Returns panels ordered from left to right
 */
export function getConnectedGroup(
  startPanel: PanelState,
  panels: Map<string, PanelState>
): PanelState[] {
  const group: PanelState[] = [];
  const visited = new Set<string>();

  // Traverse left via snappedFrom
  let current: PanelState | undefined = startPanel;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    group.unshift(current);
    if (current.snappedFrom) {
      current = panels.get(current.snappedFrom);
    } else {
      break;
    }
  }

  // Traverse right via snappedTo (skip start panel, already added)
  current = startPanel.snappedTo ? panels.get(startPanel.snappedTo) : undefined;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    group.push(current);
    if (current.snappedTo) {
      current = panels.get(current.snappedTo);
    } else {
      break;
    }
  }

  return group;
}

/**
 * Detach a panel from its snap chain
 * Clears both incoming and outgoing snap relationships
 */
export function detachFromGroup(
  panel: PanelState,
  panels: Map<string, PanelState>
): void {
  // Clear outgoing snap (to right panel)
  if (panel.snappedTo) {
    const rightPanel = panels.get(panel.snappedTo);
    if (rightPanel) {
      rightPanel.snappedFrom = null;
    }
    panel.snappedTo = null;
  }

  // Clear incoming snap (from left panel)
  if (panel.snappedFrom) {
    const leftPanel = panels.get(panel.snappedFrom);
    if (leftPanel) {
      leftPanel.snappedTo = null;
    }
    panel.snappedFrom = null;
  }
}

/**
 * Find a snap target for the moving panels
 * Checks if moving panels are close enough to snap to a stationary panel
 */
export function findSnapTarget(
  movingPanels: PanelState[],
  panels: Map<string, PanelState>,
  config: ResolvedTabManagerConfig
): SnapTarget | null {
  if (movingPanels.length === 0) return null;

  const leftmostPanel = movingPanels[0];
  const leftmostRect = leftmostPanel.element.getBoundingClientRect();

  // Calculate total width of moving group
  let totalWidth = 0;
  for (const p of movingPanels) {
    totalWidth += p.element.offsetWidth + config.panelGap;
  }
  totalWidth -= config.panelGap;

  const movingIds = new Set(movingPanels.map((p) => p.id));
  const x = leftmostRect.left;
  const y = leftmostRect.top;

  for (const [id, targetState] of panels) {
    // Skip panels that are part of the moving group
    if (movingIds.has(id)) continue;

    const targetRect = targetState.element.getBoundingClientRect();

    // Check if vertically aligned (within threshold)
    const verticalOverlap = Math.abs(y - targetRect.top) < config.snapThreshold * 2;
    if (!verticalOverlap) continue;

    // Check snap to left side of target (moving group goes to the left)
    // The rightmost panel of moving group attaches to target's left
    const snapToLeftX = targetRect.left - totalWidth - config.panelGap;
    if (
      Math.abs(x - snapToLeftX) < config.snapThreshold &&
      !targetState.snappedFrom
    ) {
      return { targetId: id, side: 'left', x: snapToLeftX, y: targetRect.top };
    }

    // Check snap to right side of target (moving group goes to the right)
    // The leftmost panel of moving group attaches to target's right
    const snapToRightX = targetRect.right + config.panelGap;
    if (
      Math.abs(x - snapToRightX) < config.snapThreshold &&
      !targetState.snappedTo
    ) {
      return { targetId: id, side: 'right', x: snapToRightX, y: targetRect.top };
    }
  }

  return null;
}

/**
 * Execute a snap operation - position panels and establish relationships
 */
export function snapPanelsToTarget(
  movingPanels: PanelState[],
  targetId: string,
  side: SnapSide,
  x: number,
  y: number,
  panels: Map<string, PanelState>,
  config: ResolvedTabManagerConfig
): void {
  const targetState = panels.get(targetId);
  if (!targetState) return;

  const leftmostPanel = movingPanels[0];
  const rightmostPanel = movingPanels[movingPanels.length - 1];

  // Position all moving panels in a row
  let currentX = x;
  for (const p of movingPanels) {
    p.element.style.left = `${currentX}px`;
    p.element.style.top = `${y}px`;
    currentX += p.element.offsetWidth + config.panelGap;
  }

  // Establish snap relationship
  if (side === 'left') {
    // Moving group goes to the LEFT of target
    // Rightmost panel of group connects to target
    rightmostPanel.snappedTo = targetId;
    targetState.snappedFrom = rightmostPanel.id;
  } else {
    // Moving group goes to the RIGHT of target
    // Leftmost panel of group connects to target
    leftmostPanel.snappedFrom = targetId;
    targetState.snappedTo = leftmostPanel.id;
  }
}

/**
 * Update positions of all snapped panels when one changes size
 * Traverses from rightmost panel leftward, repositioning as needed
 */
export function updateSnappedPositions(
  panels: Map<string, PanelState>,
  config: ResolvedTabManagerConfig
): void {
  // Find the rightmost panel in any chain (one with no snappedTo but has snappedFrom)
  let rightmost: PanelState | null = null;

  for (const state of panels.values()) {
    if (state.snappedTo === null && state.snappedFrom !== null) {
      rightmost = state;
      break;
    }
  }

  // Also check for chains starting from panels with snappedFrom
  if (!rightmost) {
    for (const state of panels.values()) {
      if (state.snappedFrom !== null) {
        rightmost = state;
        break;
      }
    }
  }

  if (!rightmost) return;

  // Traverse left and update positions
  let current: PanelState | null = rightmost;
  while (current && current.snappedFrom) {
    const leftPanel = panels.get(current.snappedFrom);
    if (!leftPanel) break;

    const currentRect = current.element.getBoundingClientRect();
    leftPanel.element.style.left = `${currentRect.left - leftPanel.element.offsetWidth - config.panelGap}px`;
    leftPanel.element.style.top = `${currentRect.top}px`;

    current = leftPanel;
  }
}

/**
 * Get the leftmost panel in a chain
 */
export function getLeftmostPanel(
  panel: PanelState,
  panels: Map<string, PanelState>
): PanelState {
  let current = panel;
  while (current.snappedFrom) {
    const left = panels.get(current.snappedFrom);
    if (!left) break;
    current = left;
  }
  return current;
}

/**
 * Get the rightmost panel in a chain
 */
export function getRightmostPanel(
  panel: PanelState,
  panels: Map<string, PanelState>
): PanelState {
  let current = panel;
  while (current.snappedTo) {
    const right = panels.get(current.snappedTo);
    if (!right) break;
    current = right;
  }
  return current;
}

/**
 * Check if two panels are in the same snap chain
 */
export function areInSameChain(
  panel1: PanelState,
  panel2: PanelState,
  panels: Map<string, PanelState>
): boolean {
  const chain = getConnectedGroup(panel1, panels);
  return chain.some((p) => p.id === panel2.id);
}

/**
 * Establish a snap relationship between two panels
 */
export function snapPanels(
  leftPanel: PanelState,
  rightPanel: PanelState
): void {
  leftPanel.snappedTo = rightPanel.id;
  rightPanel.snappedFrom = leftPanel.id;
}

/**
 * Break the snap relationship between two specific panels
 */
export function unsnap(
  leftPanel: PanelState,
  rightPanel: PanelState
): void {
  if (leftPanel.snappedTo === rightPanel.id) {
    leftPanel.snappedTo = null;
  }
  if (rightPanel.snappedFrom === leftPanel.id) {
    rightPanel.snappedFrom = null;
  }
}
