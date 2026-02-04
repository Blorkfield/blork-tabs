# @blorkfield/blork-tabs

A framework-agnostic tab/panel management system with snapping and docking capabilities.

## Features

- **Panel Snapping** - Panels snap together to form linked chains
- **Anchor Docking** - Dock panels to predefined screen positions
- **Drag Modes** - Drag entire groups or detach individual panels
- **Collapse/Expand** - Panels can be collapsed with automatic repositioning
- **Auto-Hide** - Panels can hide after inactivity and show on interaction
- **Event System** - Subscribe to drag, snap, and collapse events
- **Fully Typed** - Complete TypeScript support
- **Framework Agnostic** - Works with plain DOM or any framework
- **Customizable** - CSS variables for easy theming

## Installation

```bash
npm install @blorkfield/blork-tabs
```

## Quick Start

```typescript
import { TabManager } from '@blorkfield/blork-tabs';
import '@blorkfield/blork-tabs/styles.css';

// Create the tab manager
const manager = new TabManager({
  snapThreshold: 50,
  panelGap: 0,
  panelMargin: 16,
});

// Create panels programmatically
manager.addPanel({
  id: 'settings',
  title: 'Settings',
  content: '<div>Settings content here</div>',
});

manager.addPanel({
  id: 'tools',
  title: 'Tools',
  content: '<div>Tools content here</div>',
});

// Or register existing DOM elements
manager.registerPanel('my-panel', document.getElementById('my-panel'), {
  dragHandle: document.getElementById('my-panel-header'),
  collapseButton: document.getElementById('my-panel-collapse'),
  contentWrapper: document.getElementById('my-panel-content'),
});

// Position panels and create snap chains
manager.positionPanelsFromRight(['tools', 'settings']);
manager.createSnapChain(['settings', 'tools']);

// Listen to events
manager.on('snap:panel', ({ movingPanels, targetPanel, side }) => {
  console.log(`Panels snapped to ${side} of ${targetPanel.id}`);
});
```

## Configuration

```typescript
const manager = new TabManager({
  // Distance threshold for panel-to-panel snapping (default: 50)
  snapThreshold: 50,

  // Gap between snapped panels (default: 0)
  panelGap: 0,

  // Margin from window edges (default: 16)
  panelMargin: 16,

  // Distance threshold for anchor snapping (default: 80)
  anchorThreshold: 80,

  // Default panel width for calculations (default: 300)
  defaultPanelWidth: 300,

  // Container element (default: document.body)
  container: document.body,

  // Auto-create default anchors (default: true)
  initializeDefaultAnchors: true,

  // CSS class prefix (default: 'blork-tabs')
  classPrefix: 'blork-tabs',

  // Whether panels start hidden (default: false)
  startHidden: false,

  // Milliseconds before auto-hiding on inactivity (default: undefined = no auto-hide)
  autoHideDelay: undefined,
});
```

## API Reference

### TabManager

#### Panel Management
- `addPanel(config)` - Create a new panel
- `addDebugPanel(config)` - Create a debug panel with logging interface
- `registerPanel(id, element, options)` - Register existing DOM element
- `removePanel(id)` - Remove a panel
- `getPanel(id)` - Get panel by ID
- `getAllPanels()` - Get all panels

#### Snap Chain Management
- `getSnapChain(panelId)` - Get all panels in same chain
- `snap(leftPanelId, rightPanelId)` - Manually snap two panels
- `detach(panelId)` - Detach panel from chain
- `createSnapChain(panelIds)` - Create chain from panel IDs
- `updatePositions()` - Recalculate snapped positions

#### Positioning
- `positionPanelsFromRight(panelIds, gap?)` - Position from right edge
- `positionPanelsFromLeft(panelIds, gap?)` - Position from left edge

#### Anchors
- `addAnchor(config)` - Add custom anchor
- `addPresetAnchor(preset)` - Add preset anchor
- `removeAnchor(id)` - Remove anchor
- `getAnchors()` - Get all anchors

#### Auto-Hide
- `show(panelId)` - Show a hidden panel
- `hide(panelId)` - Hide a panel
- `isHidden(panelId)` - Check if panel is hidden

#### Events
- `on(event, listener)` - Subscribe to event
- `off(event, listener)` - Unsubscribe from event

### Events

| Event | Description |
|-------|-------------|
| `panel:added` | Panel was added |
| `panel:removed` | Panel was removed |
| `drag:start` | Drag operation started |
| `drag:move` | Panel being dragged |
| `drag:end` | Drag operation ended |
| `snap:panel` | Panels snapped together |
| `snap:anchor` | Panels snapped to anchor |
| `panel:detached` | Panel detached from chain |
| `panel:collapse` | Panel collapsed/expanded |
| `panel:show` | Panel became visible (auto-hide) |
| `panel:hide` | Panel became hidden (auto-hide) |

## Multi-Section Panel Content

When creating panels with multiple sections (like a command menu with categories), put all sections within a **single `content` string**. Do not use multiple panels or multiple content wrappers—this breaks scrolling and causes content cutoff.

**Correct approach:**

```typescript
manager.addPanel({
  id: 'command-menu',
  title: 'Commands',
  content: `
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11px; font-weight: 600; color: #4a90d9; padding: 4px 8px; text-transform: uppercase;">File</div>
      <div>New File</div>
      <div>Open...</div>
      <div>Save</div>
    </div>
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11px; font-weight: 600; color: #4a90d9; padding: 4px 8px; text-transform: uppercase;">Edit</div>
      <div>Undo</div>
      <div>Redo</div>
      <div>Cut</div>
    </div>
    <div>
      <div style="font-size: 11px; font-weight: 600; color: #4a90d9; padding: 4px 8px; text-transform: uppercase;">View</div>
      <div>Zoom In</div>
      <div>Zoom Out</div>
    </div>
  `,
});
```

The panel content area has a max-height (default `20vh`) with `overflow-y: auto`, so long content scrolls properly. Splitting sections across multiple content wrappers defeats this behavior.

## Auto-Hide

Panels can automatically hide after a period of inactivity and reappear when the user interacts with the page. This is useful for OBS overlays or any interface where you want panels to get out of the way.

### Configuration

Auto-hide has two independent options:

- **`startHidden`** - Whether the panel starts invisible (default: `false`)
- **`autoHideDelay`** - Milliseconds before hiding after inactivity (default: `undefined` = no auto-hide)

These can be set globally on the TabManager or per-panel:

```typescript
// Global: all panels hide after 3 seconds of inactivity
const manager = new TabManager({
  autoHideDelay: 3000,
  startHidden: true,
});

// Per-panel overrides
manager.addPanel({
  id: 'always-visible',
  title: 'Always Visible',
  autoHideDelay: 0,  // Disable auto-hide for this panel
});

manager.addPanel({
  id: 'quick-hide',
  title: 'Quick Hide',
  autoHideDelay: 1000,  // This panel hides faster
  startHidden: false,   // But starts visible
});
```

### Behavior Matrix

| startHidden | autoHideDelay | Behavior |
|-------------|---------------|----------|
| `false` | `undefined` | Normal - always visible |
| `true` | `undefined` | Starts hidden, shows on activity, never hides again |
| `false` | `3000` | Starts visible, hides after 3s of inactivity |
| `true` | `3000` | Starts hidden, shows on activity, hides after 3s of inactivity |

### Events

```typescript
manager.on('panel:show', ({ panel, trigger }) => {
  // trigger: 'activity' (user interaction) or 'api' (programmatic)
  console.log(`${panel.id} is now visible`);
});

manager.on('panel:hide', ({ panel, trigger }) => {
  // trigger: 'timeout' (auto-hide delay) or 'api' (programmatic)
  console.log(`${panel.id} is now hidden`);
});
```

### Programmatic Control

```typescript
manager.hide('my-panel');  // Hide immediately
manager.show('my-panel');  // Show immediately
manager.isHidden('my-panel');  // Check visibility
```

## Debug Panel

A plug-and-play debug panel for in-browser event logging—useful for OBS browser sources and other environments without console access.

### Creating a Debug Panel

```typescript
import { TabManager } from '@blorkfield/blork-tabs';

const manager = new TabManager();

// Create a debug panel
const debug = manager.addDebugPanel({
  id: 'debug',
  title: 'Event Log',        // optional, default: 'Debug'
  width: 300,                // optional, default: 300
  maxEntries: 50,            // optional, default: 50
  showTimestamps: true,      // optional, default: false
  showClearButton: true,     // optional, default: true
  startCollapsed: true,      // optional, default: true
  initialPosition: { x: 16, y: 16 },
});
```

### Logging Events

Log events with different severity levels, each with distinct color coding:

```typescript
// Info/Log level - blue (accent color)
debug.log('event-name', { some: 'data' });
debug.info('connection', { status: 'connected' });

// Warning level - yellow
debug.warn('cache', { message: 'Cache expired, refreshing...' });

// Error level - red
debug.error('request', { code: 500, message: 'Server error' });

// Clear all entries
debug.clear();
```

### Features

- **Pre-styled monospace container** - Optimized for log readability
- **Color-coded log levels** - Blue for info, yellow for warnings, red for errors
- **Auto-scroll** - Automatically scrolls to show latest entries
- **Entry limit** - Configurable max entries with FIFO removal of oldest
- **Timestamps** - Optional timestamp display for each entry
- **Hover glow effect** - Border lights up with accent color on hover
- **Enlarge on hover** - Hover for 5 seconds to expand to 75% of screen with 2x text size
- **Modal backdrop** - Enlarged view has a backdrop; click × or backdrop to close
- **Standard panel features** - Drag, snap, collapse, auto-hide all work

### Enlarged View Behavior

The debug panel has a special "focus mode" for reading logs:

1. **Hover for 5 seconds** → Panel enlarges to 75% of screen with doubled text size
2. **Mouse can move freely** → Panel stays enlarged, won't close on mouse leave
3. **Click × or backdrop** → Returns to normal size

The × button is only visible when enlarged.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxEntries` | `number` | `50` | Maximum log entries before oldest are removed |
| `showTimestamps` | `boolean` | `false` | Show timestamps on each entry |

Plus all standard `PanelConfig` options (`id`, `title`, `width`, `initialPosition`, `startCollapsed`, etc.)

### Accessing the Underlying Panel

```typescript
// The debug panel interface includes access to the panel state
debug.panel;  // PanelState - for advanced manipulation
```

## CSS Customization

Override CSS variables to customize appearance:

```css
:root {
  --blork-tabs-panel-bg: #1a1a2e;
  --blork-tabs-panel-border: 1px solid #2a2a4a;
  --blork-tabs-panel-radius: 8px;
  --blork-tabs-panel-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  --blork-tabs-header-bg: #2a2a4a;
  --blork-tabs-header-color: #e0e0e0;
  --blork-tabs-content-bg: #1a1a2e;
  --blork-tabs-content-max-height: 20vh;
  --blork-tabs-accent: #4a90d9;
}
```

For light theme, add `blork-tabs-light` class to container:

```html
<body class="blork-tabs-light">
```

## License

MIT
