/**
 * @blorkfield/blork-tabs - AnchorManager
 * Manages screen anchor points for panel docking
 */

import type {
  AnchorConfig,
  AnchorState,
  AnchorSnapResult,
  AnchorPreset,
  PanelState,
  Position,
  ResolvedTabManagerConfig,
  CSSClasses,
} from './types';

/**
 * Creates the default anchor positions
 */
export function getDefaultAnchorConfigs(
  config: ResolvedTabManagerConfig
): AnchorConfig[] {
  const { panelMargin, defaultPanelWidth } = config;

  return [
    {
      id: 'top-left',
      getPosition: () => ({ x: panelMargin, y: panelMargin }),
    },
    {
      id: 'top-right',
      getPosition: () => ({
        x: window.innerWidth - panelMargin - defaultPanelWidth,
        y: panelMargin,
      }),
    },
    {
      id: 'bottom-left',
      getPosition: () => ({
        x: panelMargin,
        y: window.innerHeight - panelMargin,
      }),
    },
    {
      id: 'bottom-right',
      getPosition: () => ({
        x: window.innerWidth - panelMargin - defaultPanelWidth,
        y: window.innerHeight - panelMargin,
      }),
    },
    {
      id: 'top-center',
      getPosition: () => ({
        x: (window.innerWidth - defaultPanelWidth) / 2,
        y: panelMargin,
      }),
    },
  ];
}

/**
 * Create an anchor preset config
 */
export function createPresetAnchor(
  preset: AnchorPreset,
  config: ResolvedTabManagerConfig
): AnchorConfig {
  const { panelMargin, defaultPanelWidth } = config;

  const presets: Record<AnchorPreset, () => Position> = {
    'top-left': () => ({ x: panelMargin, y: panelMargin }),
    'top-right': () => ({
      x: window.innerWidth - panelMargin - defaultPanelWidth,
      y: panelMargin,
    }),
    'top-center': () => ({
      x: (window.innerWidth - defaultPanelWidth) / 2,
      y: panelMargin,
    }),
    'bottom-left': () => ({
      x: panelMargin,
      y: window.innerHeight - panelMargin,
    }),
    'bottom-right': () => ({
      x: window.innerWidth - panelMargin - defaultPanelWidth,
      y: window.innerHeight - panelMargin,
    }),
    'bottom-center': () => ({
      x: (window.innerWidth - defaultPanelWidth) / 2,
      y: window.innerHeight - panelMargin,
    }),
    'center-left': () => ({
      x: panelMargin,
      y: window.innerHeight / 2,
    }),
    'center-right': () => ({
      x: window.innerWidth - panelMargin - defaultPanelWidth,
      y: window.innerHeight / 2,
    }),
  };

  return {
    id: preset,
    getPosition: presets[preset],
  };
}

/**
 * Manages anchor points and docking behavior
 */
export class AnchorManager {
  private anchors: AnchorState[] = [];
  private config: ResolvedTabManagerConfig;
  private classes: CSSClasses;
  private container: HTMLElement;

  constructor(
    config: ResolvedTabManagerConfig,
    classes: CSSClasses
  ) {
    this.config = config;
    this.classes = classes;
    this.container = config.container;

    // Set up resize handler
    window.addEventListener('resize', this.updateIndicatorPositions.bind(this));
  }

  /**
   * Create an anchor indicator element
   */
  private createIndicator(): HTMLDivElement {
    const indicator = document.createElement('div');
    indicator.className = this.classes.anchorIndicator;
    this.container.appendChild(indicator);
    return indicator;
  }

  /**
   * Add an anchor point
   */
  addAnchor(anchorConfig: AnchorConfig): AnchorState {
    const indicator =
      anchorConfig.showIndicator !== false ? this.createIndicator() : null;

    const state: AnchorState = {
      config: anchorConfig,
      indicator,
    };

    this.anchors.push(state);
    this.updateIndicatorPosition(state);

    return state;
  }

  /**
   * Add multiple default anchors
   */
  addDefaultAnchors(): void {
    const defaults = getDefaultAnchorConfigs(this.config);
    for (const config of defaults) {
      this.addAnchor(config);
    }
  }

  /**
   * Add anchor from preset
   */
  addPresetAnchor(preset: AnchorPreset): AnchorState {
    return this.addAnchor(createPresetAnchor(preset, this.config));
  }

  /**
   * Remove an anchor
   */
  removeAnchor(id: string): boolean {
    const index = this.anchors.findIndex((a) => a.config.id === id);
    if (index === -1) return false;

    const anchor = this.anchors[index];
    anchor.indicator?.remove();
    this.anchors.splice(index, 1);

    return true;
  }

  /**
   * Update position of a single indicator
   */
  private updateIndicatorPosition(anchor: AnchorState): void {
    if (!anchor.indicator) return;

    const pos = anchor.config.getPosition();
    const indicator = anchor.indicator;

    // Anchor marks where grip (left edge) lands
    indicator.style.left = `${pos.x - 20}px`; // Center indicator on anchor point

    if (anchor.config.id.includes('bottom')) {
      indicator.style.top = `${pos.y - 40}px`;
    } else {
      indicator.style.top = `${pos.y}px`;
    }
  }

  /**
   * Update all indicator positions (call on window resize)
   */
  updateIndicatorPositions(): void {
    for (const anchor of this.anchors) {
      this.updateIndicatorPosition(anchor);
    }
  }

  /**
   * Find the nearest anchor for a group of moving panels
   */
  findNearestAnchor(movingPanels: PanelState[]): AnchorSnapResult | null {
    if (movingPanels.length === 0 || this.anchors.length === 0) return null;

    let bestResult: AnchorSnapResult | null = null;
    let bestDist = Infinity;

    // Get bounding box of the entire group
    const firstRect = movingPanels[0].element.getBoundingClientRect();
    const lastRect = movingPanels[movingPanels.length - 1].element.getBoundingClientRect();
    const groupLeft = firstRect.left;
    const groupRight = lastRect.right;
    const groupTop = firstRect.top;
    const groupBottom = firstRect.bottom;

    for (const anchor of this.anchors) {
      const anchorPos = anchor.config.getPosition();

      // Check if ANY part of the group is near this anchor
      const nearGroup =
        anchorPos.x >= groupLeft - this.config.anchorThreshold &&
        anchorPos.x <= groupRight + this.config.anchorThreshold &&
        anchorPos.y >= groupTop - this.config.anchorThreshold &&
        anchorPos.y <= groupBottom + this.config.anchorThreshold;

      if (!nearGroup) continue;

      // Find which panel's GRIP (left edge) is closest to this anchor
      let closestPanelIdx = 0;
      let closestDist = Infinity;

      for (let i = 0; i < movingPanels.length; i++) {
        const rect = movingPanels[i].element.getBoundingClientRect();

        // Distance from anchor to the GRIP (left edge) of this panel
        const gripX = rect.left;
        const gripY = rect.top;
        const dist = Math.sqrt(
          Math.pow(gripX - anchorPos.x, 2) + Math.pow(gripY - anchorPos.y, 2)
        );

        if (dist < closestDist) {
          closestDist = dist;
          closestPanelIdx = i;
        }
      }

      // Calculate final positions with this panel's grip docking to anchor
      const anchorX = anchorPos.x;
      const anchorY = anchor.config.id.includes('bottom')
        ? anchorPos.y - movingPanels[closestPanelIdx].element.offsetHeight
        : anchorPos.y;

      // Calculate positions for all panels
      const positions: Position[] = [];

      // Find where leftmost panel would be (panels to left of docked one)
      let leftX = anchorX;
      for (let i = closestPanelIdx - 1; i >= 0; i--) {
        leftX -= movingPanels[i].element.offsetWidth + this.config.panelGap;
      }

      // Fill in all positions left to right
      let currentX = leftX;
      for (let i = 0; i < movingPanels.length; i++) {
        positions.push({ x: currentX, y: anchorY });
        currentX += movingPanels[i].element.offsetWidth + this.config.panelGap;
      }

      // Check if all panels fit on screen
      const leftmostX = positions[0].x;
      const rightmostX =
        positions[positions.length - 1].x +
        movingPanels[movingPanels.length - 1].element.offsetWidth;

      if (leftmostX < 0 || rightmostX > window.innerWidth) {
        // Try to find a panel that WOULD fit
        for (let tryIdx = 0; tryIdx < movingPanels.length; tryIdx++) {
          const tryPositions: Position[] = [];
          let tryLeftX = anchorX;
          for (let i = tryIdx - 1; i >= 0; i--) {
            tryLeftX -= movingPanels[i].element.offsetWidth + this.config.panelGap;
          }

          let tryCurrentX = tryLeftX;
          for (let i = 0; i < movingPanels.length; i++) {
            tryPositions.push({ x: tryCurrentX, y: anchorY });
            tryCurrentX +=
              movingPanels[i].element.offsetWidth + this.config.panelGap;
          }

          const tryLeftmostX = tryPositions[0].x;
          const tryRightmostX =
            tryPositions[tryPositions.length - 1].x +
            movingPanels[movingPanels.length - 1].element.offsetWidth;

          if (tryLeftmostX >= 0 && tryRightmostX <= window.innerWidth) {
            if (closestDist < bestDist) {
              bestDist = closestDist;
              bestResult = {
                anchor,
                dockPanelIndex: tryIdx,
                positions: tryPositions,
              };
            }
            break;
          }
        }
        continue;
      }

      // This is a valid option
      if (closestDist < bestDist) {
        bestDist = closestDist;
        bestResult = { anchor, dockPanelIndex: closestPanelIdx, positions };
      }
    }

    return bestResult;
  }

  /**
   * Show anchor indicators during drag
   */
  showIndicators(activeAnchor: AnchorState | null): void {
    for (const anchor of this.anchors) {
      if (!anchor.indicator) continue;

      if (activeAnchor === anchor) {
        anchor.indicator.classList.add(
          this.classes.anchorIndicatorVisible,
          this.classes.anchorIndicatorActive
        );
      } else {
        anchor.indicator.classList.add(this.classes.anchorIndicatorVisible);
        anchor.indicator.classList.remove(this.classes.anchorIndicatorActive);
      }
    }
  }

  /**
   * Hide all anchor indicators
   */
  hideIndicators(): void {
    for (const anchor of this.anchors) {
      if (!anchor.indicator) continue;
      anchor.indicator.classList.remove(
        this.classes.anchorIndicatorVisible,
        this.classes.anchorIndicatorActive
      );
    }
  }

  /**
   * Get all anchors
   */
  getAnchors(): AnchorState[] {
    return [...this.anchors];
  }

  /**
   * Get anchor by ID
   */
  getAnchor(id: string): AnchorState | undefined {
    return this.anchors.find((a) => a.config.id === id);
  }

  /**
   * Clean up
   */
  destroy(): void {
    window.removeEventListener('resize', this.updateIndicatorPositions.bind(this));
    for (const anchor of this.anchors) {
      anchor.indicator?.remove();
    }
    this.anchors = [];
  }
}
