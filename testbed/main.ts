// Import exactly as npm users would
import { TabManager, DebugPanel } from '@blorkfield/blork-tabs';
import '@blorkfield/blork-tabs/styles.css';

// ============================================================
// Testbed for @blorkfield/blork-tabs
// Tests all features with multiple panel configurations
// ============================================================

let manager: TabManager;
let debug: DebugPanel;
let panelCounter = 0;

function logEvent(eventName: string, data: unknown) {
  // Use the debug panel for logging
  if (debug) {
    const dataObj = typeof data === 'object' && data !== null
      ? JSON.parse(JSON.stringify(data, (_, v) => {
          if (v instanceof HTMLElement) return `[${v.tagName}]`;
          if (v instanceof Map) return Object.fromEntries(v);
          return v;
        }))
      : { value: data };
    debug.log(eventName, dataObj);
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
        <!-- Config Section -->
        <div style="background: #1a1a2e; border-radius: 6px; padding: 12px; border: 1px solid #2a2a4a;">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">Configuration</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; color: #888; min-width: 80px;">Type:</label>
              <select style="flex: 1; padding: 6px 8px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
                <option>Option A</option>
                <option>Option B</option>
                <option>Option C</option>
              </select>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; color: #888; min-width: 80px;">TTL (ms):</label>
              <input type="number" value="5000" style="width: 80px; padding: 6px 8px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; color: #888; min-width: 80px;">Weight:</label>
              <input type="number" value="1" style="width: 80px; padding: 6px 8px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; color: #888; min-width: 80px;">X:</label>
              <input type="number" value="50" style="width: 60px; padding: 6px 8px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
              <select style="width: 50px; padding: 6px 4px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
                <option>%</option>
                <option>px</option>
              </select>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; color: #888; min-width: 80px;">Y:</label>
              <input type="number" value="50" style="width: 60px; padding: 6px 8px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
              <select style="width: 50px; padding: 6px 4px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
                <option>%</option>
                <option>px</option>
              </select>
            </div>
          </div>
          <div style="margin-top: 12px;">
            <div style="font-size: 12px; color: #888; margin-bottom: 8px;">Tags</div>
            <div style="display: flex; gap: 8px; align-items: stretch;">
              <div style="flex: 1; display: flex; flex-direction: column;">
                <div style="font-size: 10px; color: #666; margin-bottom: 4px;">Available</div>
                <select multiple style="flex: 1; min-height: 60px; background: #1a1a2e; border: 1px solid #3a3a5a; border-radius: 4px; color: #fff; font-size: 11px; padding: 4px;">
                  <option>Option A</option>
                  <option>Option B</option>
                  <option>Option C</option>
                </select>
              </div>
              <div style="display: flex; flex-direction: column; justify-content: center; gap: 4px;">
                <button style="padding: 4px 8px; background: #3a4a6a; border: 1px solid #4a5a7a; border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px;">&gt;&gt;</button>
                <button style="padding: 4px 8px; background: #3a4a6a; border: 1px solid #4a5a7a; border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px;">&lt;&lt;</button>
              </div>
              <div style="flex: 1; display: flex; flex-direction: column;">
                <div style="font-size: 10px; color: #666; margin-bottom: 4px;">Selected</div>
                <select multiple style="flex: 1; min-height: 60px; background: #1a1a2e; border: 1px solid #3a3a5a; border-radius: 4px; color: #fff; font-size: 11px; padding: 4px;">
                  <option>default</option>
                </select>
              </div>
            </div>
          </div>
          <button style="margin-top: 12px; width: 100%; padding: 8px 12px; background: #3a4a6a; border: 1px solid #4a5a7a; border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px;">Test Button</button>
        </div>

        <!-- Text Section -->
        <div style="background: #1a1a2e; border-radius: 6px; padding: 12px; border: 1px solid #2a2a4a;">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">Text Section</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; color: #888; min-width: 80px;">Text:</label>
              <input type="text" value="HELLO" style="flex: 1; padding: 6px 8px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; color: #888; min-width: 80px;">Font:</label>
              <select style="flex: 1; padding: 6px 8px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
                <option>Arial</option>
                <option>Helvetica</option>
                <option>Impact</option>
              </select>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; color: #888; min-width: 80px;">Size:</label>
              <input type="number" value="60" style="width: 80px; padding: 6px 8px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; color: #888; min-width: 80px;">Color:</label>
              <input type="color" value="#ff0000" style="width: 60px; height: 28px; padding: 0; border: none; cursor: pointer;">
            </div>
          </div>
          <button style="margin-top: 12px; width: 100%; padding: 8px 12px; background: #3a4a6a; border: 1px solid #4a5a7a; border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px;">Test Button</button>
        </div>

        <!-- Actions Section -->
        <div style="background: #1a1a2e; border-radius: 6px; padding: 12px; border: 1px solid #2a2a4a;">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">Another Section</div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <select style="width: 100%; padding: 8px; border: 1px solid #3a3a5a; border-radius: 4px; background: #2a2a4a; color: #fff; font-size: 12px;">
              <option>-- Select Option --</option>
              <option>Option A</option>
              <option>Option B</option>
              <option>Option C</option>
            </select>
            <div style="display: flex; gap: 6px;">
              <button style="flex: 1; padding: 8px 12px; background: #3a4a6a; border: 1px solid #4a5a7a; border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px;">Test Button 1</button>
              <button style="flex: 1; padding: 8px 12px; background: #4a3a5a; border: 1px solid #5a4a6a; border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px;"> Test Button 2</button>
            </div>
            <div style="display: flex; gap: 6px;">
              <button style="flex: 1; padding: 8px 12px; background: #3a4a6a; border: 1px solid #4a5a7a; border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px;">Test Button 3</button>
              <button style="flex: 1; padding: 8px 12px; background: #4a3a5a; border: 1px solid #5a4a6a; border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px;">Test Button 4</button>
            </div>
          </div>
        </div>

        <!-- Toggles Section -->
        <div style="background: #1a1a2e; border-radius: 6px; padding: 12px; border: 1px solid #2a2a4a;">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">Effects</div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <label style="position: relative; width: 44px; height: 24px;">
                <input type="checkbox" checked style="opacity: 0; width: 0; height: 0;">
                <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #4a90d9; transition: 0.3s; border-radius: 24px;"></span>
              </label>
              <span style="font-size: 13px;">Section 1</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <label style="position: relative; width: 44px; height: 24px;">
                <input type="checkbox" style="opacity: 0; width: 0; height: 0;">
                <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #2a2a4a; transition: 0.3s; border-radius: 24px;"></span>
              </label>
              <span style="font-size: 13px;">Section 2</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <label style="position: relative; width: 44px; height: 24px;">
                <input type="checkbox" style="opacity: 0; width: 0; height: 0;">
                <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #2a2a4a; transition: 0.3s; border-radius: 24px;"></span>
              </label>
              <span style="font-size: 13px;">Section 3</span>
            </div>
          </div>
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

  // ============================================================
  // Debug Panel - In-browser event log using the new DebugPanel API
  // Hover for 5 seconds to enlarge, click × or backdrop to close
  // ============================================================
  debug = manager.addDebugPanel({
    id: 'debug',
    title: 'Event Log',
    width: 400,
    maxEntries: 200,  // More entries to fill enlarged view
    showTimestamps: true,
    startCollapsed: false,
    initialPosition: { x: 16, y: window.innerHeight - 300 },
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
  manager.on('panel:show', (e) => logEvent('panel:show', { panel: e.panel.id, trigger: e.trigger }));
  manager.on('panel:hide', (e) => logEvent('panel:hide', { panel: e.panel.id, trigger: e.trigger }));

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
    id: 'long-menu',
    title: 'Long Menu',
    width: 280,
    startCollapsed: false,
    initialPosition: { x: (window.innerWidth - 280) / 2, y: 300 },
    content: createSampleContent('long-menu'),
  });

  // ============================================================
  // Auto-hide panel - starts hidden, shows on activity, hides after 5s
  // ============================================================
  manager.addPanel({
    id: 'auto-hide-demo',
    title: 'Auto-Hide Demo',
    width: 250,
    startCollapsed: false,
    startHidden: true,
    autoHideDelay: 5000,
    initialPosition: { x: window.innerWidth - 300, y: 150 },
    content: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <p style="font-size: 12px; color: #feca57;">
          This panel demonstrates auto-hide behavior.
        </p>
        <ul style="font-size: 11px; color: #888; margin: 0; padding-left: 16px;">
          <li>Starts hidden</li>
          <li>Shows on mouse/keyboard activity</li>
          <li>Hides after 5 seconds of inactivity</li>
        </ul>
        <p style="font-size: 11px; color: #666; margin-top: 8px;">
          Move your mouse to keep it visible!
        </p>
      </div>
    `,
  });

  panelCounter = 12;
}

function setupControls() {
  // Reset button
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    manager.destroy();
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

  // Demo the different log levels
  debug.info('system', { status: 'initialized', version: '1.0.0' });
  debug.log('config', { panels: 12, anchors: 8 });
  debug.warn('performance', { message: 'Many panels active' });
  debug.error('demo', { code: 500, message: 'Example error entry' });
});
