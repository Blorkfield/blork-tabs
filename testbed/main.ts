// Import exactly as npm users would
import { TabManager } from '@blorkfield/blork-tabs';
import '@blorkfield/blork-tabs/styles.css';

// ============================================================
// Testbed for @blorkfield/blork-tabs
// Tests all features with multiple panel configurations
// ============================================================

let manager: TabManager;
let panelCounter = 0;

function logEvent(eventName: string, data: unknown) {
  const log = document.getElementById('event-log');
  if (!log) return;

  const entry = document.createElement('div');
  entry.className = 'event-log-entry';
  entry.innerHTML = `<span class="event-name">${eventName}</span>: ${JSON.stringify(data, (_, v) => {
    if (v instanceof HTMLElement) return `[${v.tagName}]`;
    if (v instanceof Map) return Object.fromEntries(v);
    return v;
  }, 0).slice(0, 100)}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;

  // Limit log entries
  while (log.children.length > 51) {
    log.removeChild(log.children[1]);
  }
}

function createSampleContent(type: string): string {
  switch (type) {
    case 'settings':
      return `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Dark Mode</span>
            <input type="checkbox" checked />
          </label>
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Notifications</span>
            <input type="checkbox" />
          </label>
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Auto-save</span>
            <input type="checkbox" checked />
          </label>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1);" />
          <button style="padding: 8px; background: #4a90d9; border: none; border-radius: 4px; color: white; cursor: pointer;">
            Save Settings
          </button>
        </div>
      `;

    case 'tools':
      return `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
          ${['Pen', 'Brush', 'Eraser', 'Fill', 'Select', 'Move', 'Zoom', 'Text', 'Shape']
            .map(tool => `
              <button style="padding: 12px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #e0e0e0; cursor: pointer; font-size: 11px;">
                ${tool}
              </button>
            `).join('')}
        </div>
      `;

    case 'layers':
      return `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${['Background', 'Layer 1', 'Layer 2', 'Effects', 'UI Overlay']
            .map((layer, i) => `
              <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,${i === 2 ? '0.1' : '0.02'}); border-radius: 4px; cursor: pointer;">
                <input type="checkbox" ${i !== 3 ? 'checked' : ''} />
                <span style="flex: 1; font-size: 12px;">${layer}</span>
                <span style="font-size: 10px; color: #666;">👁</span>
              </div>
            `).join('')}
        </div>
      `;

    case 'properties':
      return `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 11px; color: #888; display: block; margin-bottom: 4px;">Width</label>
            <input type="number" value="300" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #e0e0e0;" />
          </div>
          <div>
            <label style="font-size: 11px; color: #888; display: block; margin-bottom: 4px;">Height</label>
            <input type="number" value="200" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #e0e0e0;" />
          </div>
          <div>
            <label style="font-size: 11px; color: #888; display: block; margin-bottom: 4px;">Opacity</label>
            <input type="range" min="0" max="100" value="100" style="width: 100%;" />
          </div>
        </div>
      `;

    case 'colors':
      return `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px;">
            ${['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ee5a24', '#0abde3', '#10ac84', '#f368e0', '#ff9f43', '#00d2d3', '#54a0ff']
              .map(color => `
                <div style="width: 100%; padding-top: 100%; background: ${color}; border-radius: 4px; cursor: pointer;"></div>
              `).join('')}
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-size: 11px;">Custom:</span>
            <input type="color" value="#4a90d9" style="flex: 1; height: 30px; border: none; border-radius: 4px; cursor: pointer;" />
          </div>
        </div>
      `;

    case 'history':
      return `
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
          ${['Open file', 'Resize canvas', 'Apply filter', 'Add layer', 'Draw stroke', 'Undo', 'Redo', 'Save']
            .map((action, i) => `
              <div style="padding: 6px 8px; background: rgba(255,255,255,${i < 3 ? '0.05' : '0.02'}); border-radius: 4px; color: ${i < 3 ? '#e0e0e0' : '#666'};">
                ${action}
              </div>
            `).join('')}
        </div>
      `;

    case 'files':
      return `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${['project.json', 'assets/', 'components/', 'styles.css', 'index.html', 'README.md']
            .map(file => `
              <div style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: rgba(255,255,255,0.02); border-radius: 4px; cursor: pointer; font-size: 12px;">
                <span>${file.endsWith('/') ? '📁' : '📄'}</span>
                <span>${file}</span>
              </div>
            `).join('')}
        </div>
      `;

    case 'console':
      return `
        <div style="font-family: monospace; font-size: 11px; background: #0a0a0a; padding: 8px; border-radius: 4px; max-height: 150px; overflow-y: auto;">
          <div style="color: #888;">> Starting application...</div>
          <div style="color: #48dbfb;">[INFO] Loaded configuration</div>
          <div style="color: #1dd1a1;">[SUCCESS] Connected to server</div>
          <div style="color: #feca57;">[WARN] Cache expired</div>
          <div style="color: #888;">> Ready</div>
        </div>
      `;

    case 'chat':
      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="padding: 8px; background: rgba(74, 144, 217, 0.2); border-radius: 8px; font-size: 12px;">
            Hey! How's the project going?
          </div>
          <div style="padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px; font-size: 12px; align-self: flex-end;">
            Great! Just finishing up the panels.
          </div>
          <input type="text" placeholder="Type a message..." style="padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #e0e0e0; font-size: 12px;" />
        </div>
      `;

    case 'long-menu':
      return `
        <div style="display: flex; flex-direction: column; gap: 2px; font-size: 12px;">
          ${[
            'New File', 'New Window', 'New Tab', 'New Project', 'New Workspace',
            'Open File...', 'Open Folder...', 'Open Recent', 'Open from URL...',
            'Save', 'Save As...', 'Save All', 'Save Copy As...', 'Auto Save',
            'Close', 'Close All', 'Close Others', 'Close Saved', 'Close Window',
            'Preferences', 'Settings', 'Keyboard Shortcuts', 'User Snippets',
            'Undo', 'Redo', 'Undo All', 'Redo All', 'Repeat Last Action',
            'Cut', 'Copy', 'Paste', 'Paste Special', 'Delete', 'Select All',
            'Find', 'Find and Replace', 'Find in Files', 'Find Next', 'Find Previous',
            'Go to Line', 'Go to Symbol', 'Go to Definition', 'Go to Declaration',
            'View Source', 'Toggle Sidebar', 'Toggle Panel', 'Toggle Minimap',
            'Zoom In', 'Zoom Out', 'Reset Zoom', 'Full Screen', 'Zen Mode',
            'Split Editor', 'Split Down', 'Split Right', 'Close Split',
            'Run', 'Run Without Debugging', 'Start Debugging', 'Stop Debugging',
            'Step Over', 'Step Into', 'Step Out', 'Continue', 'Restart',
            'Toggle Breakpoint', 'Clear All Breakpoints', 'Enable All Breakpoints',
            'Git: Init', 'Git: Clone', 'Git: Commit', 'Git: Push', 'Git: Pull',
            'Git: Fetch', 'Git: Checkout', 'Git: Merge', 'Git: Rebase', 'Git: Stash',
            'Terminal: New', 'Terminal: Split', 'Terminal: Kill', 'Terminal: Clear',
            'Extensions: Install', 'Extensions: Update All', 'Extensions: Disable',
            'Help', 'Documentation', 'Release Notes', 'Report Issue', 'About',
            'Check for Updates', 'Privacy Policy', 'Terms of Service', 'License',
            'Export Settings', 'Import Settings', 'Reset to Defaults', 'Factory Reset',
            'Print', 'Print Preview', 'Page Setup', 'Export as PDF',
            'Share', 'Share Link', 'Collaborate', 'Invite Others', 'Live Share',
            'Format Document', 'Format Selection', 'Organize Imports', 'Sort Lines',
            'Toggle Comment', 'Add Line Comment', 'Remove Line Comment', 'Block Comment',
            'Fold', 'Unfold', 'Fold All', 'Unfold All', 'Fold Level 1', 'Fold Level 2',
            'Transform to Uppercase', 'Transform to Lowercase', 'Transform to Title Case',
            'Trim Trailing Whitespace', 'Convert Indentation', 'Detect Indentation',
            'Insert Line Above', 'Insert Line Below', 'Move Line Up', 'Move Line Down',
            'Duplicate Line', 'Delete Line', 'Join Lines', 'Transpose Characters',
            'Expand Selection', 'Shrink Selection', 'Add Cursor Above', 'Add Cursor Below',
            'Select All Occurrences', 'Change All Occurrences', 'Rename Symbol',
            'Peek Definition', 'Peek References', 'Peek Type Definition',
            'Show Hover', 'Trigger Suggest', 'Parameter Hints', 'Quick Fix',
            'Refactor', 'Extract Method', 'Extract Variable', 'Inline Variable',
            'Source Action', 'Organize Imports', 'Generate Getters/Setters',
            'Toggle Word Wrap', 'Toggle Render Whitespace', 'Toggle Control Characters',
            'Compare with Saved', 'Compare with Clipboard', 'Compare Selected',
            'Bookmark: Toggle', 'Bookmark: Next', 'Bookmark: Previous', 'Bookmark: Clear',
            'Task: Run Task', 'Task: Configure Tasks', 'Task: Terminate Task',
            'Build: Build', 'Build: Rebuild', 'Build: Clean', 'Build: Cancel',
            'Test: Run All', 'Test: Run Failed', 'Test: Debug', 'Test: Coverage',
            'Deploy', 'Deploy to Staging', 'Deploy to Production', 'Rollback',
            'Open in Browser', 'Copy Path', 'Copy Relative Path', 'Reveal in Finder',
            'Add to Workspace', 'Remove from Workspace', 'Duplicate Workspace',
            'Color Theme', 'File Icon Theme', 'Product Icon Theme', 'High Contrast',
            'Screen Reader Mode', 'Reduce Motion', 'Accessibility Help',
          ].map((item, i) => `
            <div style="padding: 6px 12px; background: rgba(255,255,255,${i % 2 === 0 ? '0.03' : '0.01'}); border-radius: 4px; cursor: pointer; transition: background 0.15s; display: flex; justify-content: space-between; align-items: center;" onmouseover="this.style.background='rgba(74,144,217,0.2)'" onmouseout="this.style.background='rgba(255,255,255,${i % 2 === 0 ? '0.03' : '0.01'})'">
              <span>${item}</span>
              <span style="color: #666; font-size: 10px;">${i % 5 === 0 ? '⌘' + String.fromCharCode(65 + (i % 26)) : ''}</span>
            </div>
          `).join('')}
        </div>
      `;

    default:
      return `<p style="color: #888; font-size: 12px;">Content for ${type}</p>`;
  }
}

function initializeTestbed() {
  // Create TabManager with default settings
  manager = new TabManager({
    snapThreshold: 50,
    panelGap: 0,
    panelMargin: 16,
    anchorThreshold: 80,
    initializeDefaultAnchors: true,
  });

  // Subscribe to all events for logging
  manager.on('panel:added', (e) => logEvent('panel:added', { id: e.panel.id }));
  manager.on('panel:removed', (e) => logEvent('panel:removed', e));
  manager.on('drag:start', (e) => logEvent('drag:start', { panel: e.panel.id, mode: e.mode }));
  manager.on('drag:end', (e) => logEvent('drag:end', { panel: e.panel.id, snappedPanel: e.snappedToPanel, snappedAnchor: e.snappedToAnchor }));
  manager.on('snap:panel', (e) => logEvent('snap:panel', { panels: e.movingPanels.map(p => p.id), target: e.targetPanel.id }));
  manager.on('snap:anchor', (e) => logEvent('snap:anchor', { panels: e.movingPanels.map(p => p.id), anchor: e.anchor.config.id }));
  manager.on('panel:detached', (e) => logEvent('panel:detached', { panel: e.panel.id }));
  manager.on('panel:collapse', (e) => logEvent('panel:collapse', { panel: e.panel.id, collapsed: e.isCollapsed }));

  // ============================================================
  // Group 1: Right side - IDE-like tools (pre-snapped chain)
  // ============================================================
  manager.addPanel({
    id: 'settings',
    title: 'Settings',
    width: 250,
    startCollapsed: false,
    content: createSampleContent('settings'),
  });

  manager.addPanel({
    id: 'tools',
    title: 'Tools',
    width: 200,
    startCollapsed: false,
    content: createSampleContent('tools'),
  });

  manager.addPanel({
    id: 'properties',
    title: 'Properties',
    width: 220,
    startCollapsed: false,
    content: createSampleContent('properties'),
  });

  // Position and snap together on right side
  manager.positionPanelsFromRight(['settings', 'tools', 'properties']);
  manager.createSnapChain(['settings', 'tools', 'properties']);

  // ============================================================
  // Group 2: Left side - File browser / layers (pre-snapped)
  // ============================================================
  manager.addPanel({
    id: 'files',
    title: 'Files',
    width: 200,
    startCollapsed: false,
    content: createSampleContent('files'),
  });

  manager.addPanel({
    id: 'layers',
    title: 'Layers',
    width: 200,
    startCollapsed: false,
    content: createSampleContent('layers'),
  });

  // Position on left
  manager.positionPanelsFromLeft(['files', 'layers']);
  manager.createSnapChain(['files', 'layers']);

  // ============================================================
  // Group 3: Bottom area - Console / History (independent)
  // ============================================================
  manager.addPanel({
    id: 'console',
    title: 'Console',
    width: 350,
    startCollapsed: true,
    initialPosition: { x: 450, y: window.innerHeight - 250 },
    content: createSampleContent('console'),
  });

  manager.addPanel({
    id: 'history',
    title: 'History',
    width: 200,
    startCollapsed: true,
    initialPosition: { x: 820, y: window.innerHeight - 250 },
    content: createSampleContent('history'),
  });

  // ============================================================
  // Group 4: Top center - Color picker (standalone)
  // ============================================================
  manager.addPanel({
    id: 'colors',
    title: 'Colors',
    width: 220,
    startCollapsed: false,
    initialPosition: { x: (window.innerWidth - 220) / 2, y: 150 },
    content: createSampleContent('colors'),
  });

  // ============================================================
  // Group 5: Floating - Chat panel
  // ============================================================
  manager.addPanel({
    id: 'chat',
    title: 'Team Chat',
    width: 280,
    startCollapsed: true,
    initialPosition: { x: window.innerWidth - 320, y: window.innerHeight - 300 },
    content: createSampleContent('chat'),
  });

  // ============================================================
  // Wide panel - testing different width
  // ============================================================
  manager.addPanel({
    id: 'wide-panel',
    title: 'Wide Panel Test',
    width: 450,
    startCollapsed: true,
    initialPosition: { x: 200, y: 200 },
    content: `
      <div style="font-size: 12px; color: #888;">
        <p>This is a wider panel to test different widths.</p>
        <p style="margin-top: 8px;">Width: 450px</p>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button style="flex: 1; padding: 8px; background: #4a90d9; border: none; border-radius: 4px; color: white; cursor: pointer;">Action 1</button>
          <button style="flex: 1; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #e0e0e0; cursor: pointer;">Action 2</button>
        </div>
      </div>
    `,
  });

  // ============================================================
  // Non-collapsible panel test
  // ============================================================
  manager.addPanel({
    id: 'non-collapsible',
    title: 'Always Open',
    width: 180,
    startCollapsed: false,
    collapsible: false,
    initialPosition: { x: 16, y: window.innerHeight - 200 },
    content: `
      <p style="font-size: 12px; color: #888;">
        This panel cannot be collapsed.
      </p>
    `,
  });

  // ============================================================
  // Long menu panel for scroll testing
  // ============================================================
  manager.addPanel({
    id: 'command-history',
    title: 'Command History',
    width: 280,
    startCollapsed: false,
    initialPosition: { x: (window.innerWidth - 280) / 2, y: 300 },
    content: createSampleContent('long-menu'),
  });

  panelCounter = 11;
}

function setupControls() {
  // Reset button
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    manager.destroy();
    document.getElementById('event-log')!.innerHTML = '<div class="event-log-title">Event Log</div>';
    initializeTestbed();
    logEvent('system', 'Reset complete');
  });

  // Toggle theme
  let isLight = false;
  document.getElementById('btn-toggle-theme')?.addEventListener('click', () => {
    isLight = !isLight;
    document.body.classList.toggle('blork-tabs-light', isLight);
    logEvent('system', `Theme: ${isLight ? 'light' : 'dark'}`);
  });

  // Collapse all
  document.getElementById('btn-collapse-all')?.addEventListener('click', () => {
    manager.getAllPanels().forEach(panel => {
      if (!panel.isCollapsed && panel.collapseButton) {
        panel.collapseButton.click();
      }
    });
  });

  // Expand all
  document.getElementById('btn-expand-all')?.addEventListener('click', () => {
    manager.getAllPanels().forEach(panel => {
      if (panel.isCollapsed && panel.collapseButton) {
        panel.collapseButton.click();
      }
    });
  });

  // Add panel
  document.getElementById('btn-add-panel')?.addEventListener('click', () => {
    panelCounter++;
    const contentTypes = ['settings', 'tools', 'layers', 'properties', 'colors', 'history', 'files', 'console'];
    const randomContent = contentTypes[Math.floor(Math.random() * contentTypes.length)];

    manager.addPanel({
      id: `panel-${panelCounter}`,
      title: `Panel ${panelCounter}`,
      width: 200 + Math.floor(Math.random() * 100),
      startCollapsed: false,
      initialPosition: {
        x: 100 + Math.random() * 400,
        y: 150 + Math.random() * 300,
      },
      content: createSampleContent(randomContent),
    });
  });

  // Snap chain demo
  document.getElementById('btn-snap-chain')?.addEventListener('click', () => {
    const panels = manager.getAllPanels().filter(p => !p.snappedTo && !p.snappedFrom);
    if (panels.length >= 2) {
      const ids = panels.slice(0, 3).map(p => p.id);
      manager.createSnapChain(ids);
      logEvent('system', `Created chain: ${ids.join(' -> ')}`);
    } else {
      logEvent('system', 'Need at least 2 unsnapped panels');
    }
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initializeTestbed();
  setupControls();
  logEvent('system', 'Testbed initialized');
});
