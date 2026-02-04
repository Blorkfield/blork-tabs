/**
 * @blorkfield/blork-tabs - DebugPanel
 * In-browser debug log panel for environments without console access
 */

import type { DebugPanelConfig, DebugPanel, DebugLogLevel, PanelState, CSSClasses } from './types';

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
