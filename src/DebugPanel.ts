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
 * Create the interface for interacting with a debug panel
 */
export function createDebugPanelInterface(
  panel: PanelState,
  elements: DebugPanelElements,
  config: DebugPanelConfig,
  classes: CSSClasses
): DebugPanel {
  const maxEntries = config.maxEntries ?? 50;
  const showTimestamps = config.showTimestamps ?? false;

  function addEntry(level: DebugLogLevel, eventName: string, data?: Record<string, unknown>): void {
    const entry = document.createElement('div');
    entry.className = classes.debugLogEntry;

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
    elements.logContainer.appendChild(entry);
    elements.logContainer.scrollTop = elements.logContainer.scrollHeight;

    // Remove oldest entries if over limit
    while (elements.logContainer.children.length > maxEntries) {
      elements.logContainer.removeChild(elements.logContainer.children[0]);
    }
  }

  return {
    panel,
    log: (name, data) => addEntry('log', name, data),
    info: (name, data) => addEntry('info', name, data),
    warn: (name, data) => addEntry('warn', name, data),
    error: (name, data) => addEntry('error', name, data),
    clear: () => { elements.logContainer.innerHTML = ''; }
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
  const maxEntries = config.maxEntries ?? 50;
  const showTimestamps = config.showTimestamps ?? false;

  // Create log container
  const logContainer = document.createElement('div');
  logContainer.className = classes.debugLog;
  container.appendChild(logContainer);

  function addEntry(level: DebugLogLevel, eventName: string, data?: Record<string, unknown>): void {
    const entry = document.createElement('div');
    entry.className = classes.debugLogEntry;

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

    // Remove oldest entries if over limit
    while (logContainer.children.length > maxEntries) {
      logContainer.removeChild(logContainer.children[0]);
    }
  }

  const debugLog: DebugLog = {
    log: (name, data) => addEntry('log', name, data),
    info: (name, data) => addEntry('info', name, data),
    warn: (name, data) => addEntry('warn', name, data),
    error: (name, data) => addEntry('error', name, data),
    clear: () => { logContainer.innerHTML = ''; }
  };

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
