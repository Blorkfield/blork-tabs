/**
 * @blorkfield/blork-tabs - DebugPanel
 * In-browser debug log panel for environments without console access
 */

import type { DebugPanelConfig, DebugPanel, DebugLog, DebugLogConfig, DebugLogLevel, PanelState, CSSClasses } from './types';

export interface DebugPanelElements {
  logContainer: HTMLDivElement;
  clearButton: HTMLButtonElement | null;
}

/**
 * Create the content element for a debug panel
 */
export function createDebugPanelContent(
  _config: DebugPanelConfig,
  classes: CSSClasses
): { content: HTMLDivElement; elements: DebugPanelElements } {
  const content = document.createElement('div');

  const logContainer = document.createElement('div');
  logContainer.className = classes.debugLog;
  content.appendChild(logContainer);

  return {
    content,
    elements: { logContainer, clearButton: null }
  };
}

/**
 * Create the interface for interacting with a debug panel.
 * Uses the shared createDebugLogInterface internally.
 */
export function createDebugPanelInterface(
  panel: PanelState,
  elements: DebugPanelElements,
  config: DebugPanelConfig,
  classes: CSSClasses
): DebugPanel {
  const debugLog = createDebugLogInterface(elements.logContainer, config, classes);
  return {
    panel,
    ...debugLog,
  };
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Shared interface config for debug log creation
 */
interface DebugLogInterfaceConfig {
  maxEntries?: number;
  showTimestamps?: boolean;
}

/**
 * Create the logging interface for a debug log container.
 * This is the shared implementation used by both standalone panels and embedded logs.
 */
export function createDebugLogInterface(
  logContainer: HTMLElement,
  config: DebugLogInterfaceConfig,
  classes: CSSClasses
): DebugLog {
  const maxEntries = config.maxEntries ?? 50;
  const showTimestamps = config.showTimestamps ?? false;
  const entryClass = classes.debugLogEntry;

  function addEntry(level: DebugLogLevel, eventName: string, data?: Record<string, unknown>): void {
    const entry = document.createElement('div');
    entry.className = entryClass;

    // Add level-specific class for color coding
    if (level === 'warn') entry.classList.add(classes.debugLogEntryWarn);
    if (level === 'error') entry.classList.add(classes.debugLogEntryError);

    let html = '';

    if (showTimestamps) {
      const time = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      html += `<span class="${classes.debugLogTimestamp}">${time}</span>`;
    }

    html += `<span class="${classes.debugLogName}">${escapeHtml(eventName)}</span>`;

    if (data) {
      const dataStr = JSON.stringify(data);
      html += `<span class="${classes.debugLogData}">${escapeHtml(dataStr)}</span>`;
    }

    entry.innerHTML = html;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;

    // Remove oldest entries if over limit (only count actual log entries, not the close button)
    const entries = logContainer.querySelectorAll(`.${entryClass}`);
    if (entries.length > maxEntries) {
      const toRemove = entries.length - maxEntries;
      for (let i = 0; i < toRemove; i++) {
        entries[i].remove();
      }
    }
  }

  function clearEntries(): void {
    // Only remove log entries, preserve the close button
    const entries = logContainer.querySelectorAll(`.${entryClass}`);
    entries.forEach(entry => entry.remove());
  }

  return {
    log: (name, data) => addEntry('log', name, data),
    info: (name, data) => addEntry('info', name, data),
    warn: (name, data) => addEntry('warn', name, data),
    error: (name, data) => addEntry('error', name, data),
    clear: clearEntries,
  };
}

export interface DebugLogSetup {
  debugLog: DebugLog;
  logContainer: HTMLDivElement;
}

/**
 * Create an embeddable debug log in any container element
 */
export function createDebugLog(
  container: HTMLElement,
  config: DebugLogConfig,
  classes: CSSClasses
): DebugLogSetup {
  // Create log container
  const logContainer = document.createElement('div');
  logContainer.className = classes.debugLog;
  container.appendChild(logContainer);

  // Use shared interface creation
  const debugLog = createDebugLogInterface(logContainer, config, classes);

  return { debugLog, logContainer };
}

export interface HoverEnlargeConfig {
  /** The log container element (.blork-tabs-debug-log) to enlarge */
  logContainer: HTMLElement;
  /** Hover delay in ms (0 = disable) */
  hoverDelay: number;
  /** Container to append backdrop to */
  backdropContainer: HTMLElement;
  /** CSS classes */
  classes: CSSClasses;
  /** Called when hovering starts */
  onHoverStart?: () => void;
  /** Called when hovering ends (without enlarging) */
  onHoverEnd?: () => void;
  /** Called when enlarged view is closed */
  onClose?: () => void;
}

/**
 * Set up hover-to-enlarge behavior for a debug log container.
 * Works the same for both standalone debug panels and embedded logs.
 */
export function setupHoverEnlarge(config: HoverEnlargeConfig): void {
  const { logContainer, hoverDelay, backdropContainer, classes, onHoverStart, onHoverEnd, onClose } = config;

  // Add debug panel class for hover border effect
  logContainer.classList.add(classes.debugPanel);

  // Create close button inside the log container
  const closeBtn = document.createElement('button');
  closeBtn.className = classes.debugClearButton;
  closeBtn.textContent = '×';
  closeBtn.title = 'Close enlarged view';
  logContainer.appendChild(closeBtn);

  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  let isEnlarged = false;
  let backdrop: HTMLDivElement | null = null;
  let originalParent: HTMLElement | null = null;
  let placeholder: Comment | null = null;

  const closeEnlarged = () => {
    if (!isEnlarged) return;
    isEnlarged = false;
    logContainer.classList.remove(classes.debugPanelEnlarged);

    // Move log container back to original parent
    if (originalParent && placeholder) {
      originalParent.insertBefore(logContainer, placeholder);
      placeholder.remove();
      placeholder = null;
      originalParent = null;
    }

    if (backdrop) {
      backdrop.remove();
      backdrop = null;
    }
    onClose?.();
  };

  const openEnlarged = () => {
    if (isEnlarged) return;
    isEnlarged = true;

    // Create backdrop
    backdrop = document.createElement('div');
    backdrop.className = classes.debugBackdrop;
    backdropContainer.appendChild(backdrop);

    // Click backdrop to close
    backdrop.addEventListener('click', closeEnlarged);

    // Move log container to body to escape parent stacking context
    originalParent = logContainer.parentElement;
    placeholder = document.createComment('debug-log-placeholder');
    originalParent?.insertBefore(placeholder, logContainer);
    backdropContainer.appendChild(logContainer);

    // Add enlarged class to log container
    logContainer.classList.add(classes.debugPanelEnlarged);
  };

  // Hover to start enlarge timer
  logContainer.addEventListener('mouseenter', () => {
    onHoverStart?.();
    if (isEnlarged) return;
    if (hoverDelay > 0) {
      hoverTimeout = setTimeout(() => {
        openEnlarged();
      }, hoverDelay);
    }
  });

  // Cancel timer if mouse leaves
  logContainer.addEventListener('mouseleave', () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    if (!isEnlarged) {
      onHoverEnd?.();
    }
  });

  // Close button closes enlarged view
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeEnlarged();
  });
}
