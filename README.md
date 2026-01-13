# @blorkfield/blork-tabs

A framework-agnostic tab/panel management system with snapping and docking capabilities.

## Features

- **Panel Snapping** - Panels snap together to form linked chains
- **Anchor Docking** - Dock panels to predefined screen positions
- **Drag Modes** - Drag entire groups or detach individual panels
- **Collapse/Expand** - Panels can be collapsed with automatic repositioning
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
});
```

## API Reference

### TabManager

#### Panel Management
- `addPanel(config)` - Create a new panel
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
  --blork-tabs-accent: #4a90d9;
}
```

For light theme, add `blork-tabs-light` class to container:

```html
<body class="blork-tabs-light">
```

## License

MIT
