/**
 * @blorkfield/blork-tabs - DragManager
 * Handles drag operations for panels including single and group modes
 */

import type {
  PanelState,
  DragState,
  DragMode,
  Position,
  SnapTarget,
  AnchorSnapResult,
  ResolvedTabManagerConfig,
} from './types';
import {
  getConnectedGroup,
  detachFromGroup,
  findSnapTarget,
  snapPanelsToTarget,
} from './SnapChain';
import { setPanelZIndex, getDragZIndex, getDefaultZIndex } from './Panel';

export interface DragCallbacks {
  onDragStart?: (state: DragState) => void;
  onDragMove?: (
    state: DragState,
    position: Position,
    snapTarget: SnapTarget | null,
    anchorResult: AnchorSnapResult | null
  ) => void;
  onDragEnd?: (
    state: DragState,
    snapTarget: SnapTarget | null,
    anchorResult: AnchorSnapResult | null
  ) => void;
  findAnchorTarget?: (movingPanels: PanelState[]) => AnchorSnapResult | null;
}

/**
 * Creates and manages drag operations
 */
export class DragManager {
  private panels: Map<string, PanelState>;
  private config: ResolvedTabManagerConfig;
  private callbacks: DragCallbacks;
  private activeDrag: DragState | null = null;

  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;

  constructor(
    panels: Map<string, PanelState>,
    config: ResolvedTabManagerConfig,
    callbacks: DragCallbacks
  ) {
    this.panels = panels;
    this.config = config;
    this.callbacks = callbacks;

    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);

    // Attach global listeners
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  /**
   * Start a drag operation
   */
  startDrag(
    e: MouseEvent,
    panel: PanelState,
    mode: DragMode
  ): void {
    e.preventDefault();
    e.stopPropagation();

    const connectedPanels = getConnectedGroup(panel, this.panels);

    // Store initial positions
    const initialGroupPositions = new Map<string, Position>();
    for (const p of connectedPanels) {
      const rect = p.element.getBoundingClientRect();
      initialGroupPositions.set(p.id, { x: rect.left, y: rect.top });
    }

    let movingPanels: PanelState[];

    if (mode === 'single') {
      // Detach this panel from its group
      detachFromGroup(panel, this.panels);
      movingPanels = [panel];
    } else {
      // Move entire group
      movingPanels = connectedPanels;
    }

    const rect = panel.element.getBoundingClientRect();

    this.activeDrag = {
      grabbedPanel: panel,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      initialGroupPositions,
      movingPanels,
      mode,
    };

    // Raise moving panels z-index
    for (const p of movingPanels) {
      setPanelZIndex(p, getDragZIndex(p));
    }

    // Disable text selection during drag
    document.body.style.userSelect = 'none';

    this.callbacks.onDragStart?.(this.activeDrag);
  }

  /**
   * Handle mouse movement during drag
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.activeDrag) return;

    const { grabbedPanel, movingPanels, initialGroupPositions, mode } = this.activeDrag;
    const panel = grabbedPanel.element;

    const x = e.clientX - this.activeDrag.offsetX;
    const y = e.clientY - this.activeDrag.offsetY;

    // Clamp to window bounds
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    const clampedX = Math.max(0, Math.min(x, maxX));
    const clampedY = Math.max(0, Math.min(y, maxY));

    // Move the grabbed panel
    panel.style.left = `${clampedX}px`;
    panel.style.top = `${clampedY}px`;

    // If group mode, move other panels to maintain formation
    if (mode === 'group' && movingPanels.length > 1) {
      const grabbedInitialPos = initialGroupPositions.get(grabbedPanel.id)!;
      const deltaX = clampedX - grabbedInitialPos.x;
      const deltaY = clampedY - grabbedInitialPos.y;

      for (const p of movingPanels) {
        if (p === grabbedPanel) continue;
        const initialPos = initialGroupPositions.get(p.id)!;
        const newX = Math.max(
          0,
          Math.min(initialPos.x + deltaX, window.innerWidth - p.element.offsetWidth)
        );
        const newY = Math.max(
          0,
          Math.min(initialPos.y + deltaY, window.innerHeight - p.element.offsetHeight)
        );
        p.element.style.left = `${newX}px`;
        p.element.style.top = `${newY}px`;
      }
    }

    // Check for snap targets
    const snapTarget = findSnapTarget(movingPanels, this.panels, this.config);

    // Check for anchor targets (only if no panel snap)
    const anchorResult = snapTarget
      ? null
      : this.callbacks.findAnchorTarget?.(movingPanels) ?? null;

    this.callbacks.onDragMove?.(
      this.activeDrag,
      { x: clampedX, y: clampedY },
      snapTarget,
      anchorResult
    );
  }

  /**
   * Handle mouse up - finalize drag
   */
  private handleMouseUp(_e: MouseEvent): void {
    if (!this.activeDrag) return;

    const { movingPanels } = this.activeDrag;

    // Check for snap targets
    const snapTarget = findSnapTarget(movingPanels, this.panels, this.config);

    let anchorResult: AnchorSnapResult | null = null;

    if (snapTarget) {
      // Snap the group to the target panel
      snapPanelsToTarget(
        movingPanels,
        snapTarget.targetId,
        snapTarget.side,
        snapTarget.x,
        snapTarget.y,
        this.panels,
        this.config
      );
    } else {
      // Check anchor snap
      anchorResult = this.callbacks.findAnchorTarget?.(movingPanels) ?? null;
      if (anchorResult) {
        // Apply the pre-calculated positions
        for (let i = 0; i < movingPanels.length; i++) {
          movingPanels[i].element.style.left = `${anchorResult.positions[i].x}px`;
          movingPanels[i].element.style.top = `${anchorResult.positions[i].y}px`;
        }
      }
    }

    // Restore z-index
    for (const p of movingPanels) {
      setPanelZIndex(p, getDefaultZIndex(p));
    }

    // Restore text selection
    document.body.style.userSelect = '';

    this.callbacks.onDragEnd?.(this.activeDrag, snapTarget, anchorResult);

    this.activeDrag = null;
  }

  /**
   * Check if a drag is currently in progress
   */
  isActive(): boolean {
    return this.activeDrag !== null;
  }

  /**
   * Get the current drag state
   */
  getState(): DragState | null {
    return this.activeDrag;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }
}
