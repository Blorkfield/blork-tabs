/**
 * @blorkfield/blork-tabs - SnapPreview
 * Visual feedback for snap targets during drag operations
 */

import type {
  SnapTarget,
  PanelState,
  CSSClasses,
} from './types';

/**
 * Manages the visual snap preview indicator
 */
export class SnapPreview {
  private element: HTMLDivElement | null = null;
  private classes: CSSClasses;
  private container: HTMLElement;
  private panels: Map<string, PanelState>;

  constructor(
    container: HTMLElement,
    classes: CSSClasses,
    panels: Map<string, PanelState>
  ) {
    this.container = container;
    this.classes = classes;
    this.panels = panels;
  }

  /**
   * Create the preview element lazily
   */
  private ensureElement(): HTMLDivElement {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = this.classes.snapPreview;
      this.container.appendChild(this.element);
    }
    return this.element;
  }

  /**
   * Update the preview to show a snap target
   */
  show(snapTarget: SnapTarget): void {
    const preview = this.ensureElement();
    const targetState = this.panels.get(snapTarget.targetId);

    if (!targetState) {
      this.hide();
      return;
    }

    const targetRect = targetState.element.getBoundingClientRect();
    preview.style.top = `${targetRect.top}px`;
    preview.style.height = `${targetRect.height}px`;
    preview.style.left = `${
      snapTarget.side === 'left' ? targetRect.left - 2 : targetRect.right - 2
    }px`;
    preview.classList.add(this.classes.snapPreviewVisible);
  }

  /**
   * Hide the preview
   */
  hide(): void {
    if (this.element) {
      this.element.classList.remove(this.classes.snapPreviewVisible);
    }
  }

  /**
   * Update based on current snap target (convenience method)
   */
  update(snapTarget: SnapTarget | null): void {
    if (snapTarget) {
      this.show(snapTarget);
    } else {
      this.hide();
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.element?.remove();
    this.element = null;
  }
}
