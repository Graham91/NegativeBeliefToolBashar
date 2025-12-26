# Belief System App - Project Documentation

## Overview
An Electron-based React application for visualizing and managing hierarchical belief systems using an interactive tree structure.

## Project Structure

```
my-react-electron-app/
├── src/
│   ├── App.jsx                 # Main application component
│   ├── App.css                 # Global styles
│   ├── index.js                # Main Electron process
│   ├── preload.js              # Electron preload script
│   ├── renderer.jsx            # React renderer entry point
│   └── components/
│       ├── TreeView.jsx        # Main tree visualization component
│       ├── MainQuestion.jsx    # Root node component
│       └── ChildQuestion.jsx   # Child node component
├── forge.config.js
├── package.json
└── webpack.config.js
```

## Core Features

### 1. Tree Visualization
- **Interactive Canvas**: Pan and zoom functionality for navigating large tree structures
- **Layer-based Layout**: Automatic positioning of nodes in hierarchical layers
- **Connection Lines**: Smart orthogonal line routing between parent and child nodes
- **Visual Hierarchy**: Main question (root) highlighted with purple gradient and gold border

### 2. Node Types

#### Main Question Node
- Purple gradient background with gold border
- Contains:
  - Question input field
  - Optional solution field
  - Add Child button
- Cannot be deleted (root node)
- Single-click to select
- Double-click to edit

#### Child Question Nodes
- White background with blue accents
- Contains:
  - "If" field
  - "Then" field
  - Optional "Solution" field
  - Add Child button
  - Hide/Show Children toggle
  - Delete button (🗑 trash icon, top-right corner)
- Single-click to select and highlight path
- Double-click to edit

### 3. Node Management

#### Adding Children
- Click "+ Add Child" button on any node
- Creates new child with empty If/Then/Solution fields
- Automatically positioned in tree layout
- Unique ID generated using timestamp

#### Editing Nodes
- Double-click any node to open edit modal
- Modal centers the view on the selected node
- Edit fields:
  - Main Question: Question, Solution
  - Child Questions: If, Then, Solution
- Changes saved in real-time to project data

#### Deleting Nodes
- Small red trash can button (🗑) in top-right corner of child nodes
- Removes the node and all its descendants
- Only available on child nodes (main question cannot be deleted)

#### Hiding/Showing Children
- "Hide Children" / "Show Children" toggle button
- Hides/shows entire subtree
- Inactive nodes shown with reduced opacity (50%)
- Hidden children are not rendered or positioned

### 4. Path Highlighting
- **Single-click selection**: Click any node to highlight its path to the root
- **Visual feedback**: 
  - Selected path lines turn blue (#4a90e2)
  - Line thickness increases from 2px to 4px
  - Highlights all connections from clicked node to main question

### 5. Line Routing Algorithm

#### Smart Connection Lines
- **Orthogonal routing**: Lines travel horizontally then vertically
- **Conflict avoidance**: Automatic spacing to prevent line overlaps
- **Direction-aware**: 
  - Right-going lines: Start lower, move up
  - Left-going lines: Start at ideal position, move down
- **Straight-down optimization**: Direct vertical line when child is directly below parent

#### Configuration
- Line spacing: 16px minimum vertical distance
- Padding: 30px minimum horizontal distance between segments
- Max conflict resolution attempts: 200

### 6. Canvas Controls

#### Pan
- Click and drag on canvas background to pan
- Cursor changes to grabbing hand during drag
- Pan state persists during session

#### Zoom
- Mouse wheel to zoom in/out
- Zoom range: 10% to 300%
- Zoom controls in bottom-right corner:
  - "+" button: Zoom in
  - "-" button: Zoom out  
  - Percentage display
  - "Reset" button: Reset zoom to 100% and pan to default

#### Additional Controls
- "Debug Lines" button: Logs line segment data to console

### 7. Data Persistence

#### Project Structure
```javascript
{
  projectName: "New Project",
  LastSaveTime: null,
  ProjectStructure: {
    MainQuestion: {
      QuestionInput: "",
      ID: "main-0",
      solution: "",
      children: [
        {
          ID: "child-{timestamp}",
          If: "",
          then: "",
          Solution: "",
          parentId: "main-0",
          showChildren: "true",
          children: []
        }
      ]
    }
  }
}
```

#### Electron Integration
- File open events
- Save data functionality
- Event listeners properly cleaned up to prevent memory leaks
- Uses ref pattern to avoid re-registering listeners on state changes

### 8. Node Positioning System

#### Layer-based Layout
- Horizontal spacing: 230px between siblings
- Vertical spacing: 250px between layers
- Centering: Children centered under their parent groups
- Dynamic adjustment: Prevents overlaps by spacing groups

#### Position Calculation
1. Collect all visible nodes by layer
2. Group siblings by parent
3. Calculate group widths and positions
4. Center entire layer around parent midpoints
5. Store positions in state for rendering

## Technical Details

### State Management
- `zoom`: Current zoom level (0.1 - 3.0)
- `pan`: Canvas pan position {x, y}
- `isDragging`: Pan drag state
- `editingNode`: Currently edited node (opens modal)
- `selectedNode`: Currently selected node ID (for path highlighting)
- `nodePositions`: Calculated positions for all visible nodes
- `projectData`: Complete project data structure

### Event Handling

#### Wheel Events
- Custom event listener with `{ passive: false }` option
- Allows preventDefault() for zoom control
- Properly cleaned up in useEffect

#### Click Events
- Single-click: Node selection and path highlighting
- Double-click: Open edit modal
- Button clicks use stopPropagation() to prevent parent handlers

### Performance Optimizations
- useEffect dependencies carefully managed
- Ref pattern for projectData to prevent listener re-registration
- Position calculations only on projectData changes
- Line routing cached in assignedSegments

## Styling

### Color Scheme
- Background: Dark blue gradient (#1a1a2e to #16213e)
- Main node: Purple gradient (#667eea to #764ba2)
- Child nodes: White (#ffffff)
- Accent color: Blue (#4a90e2)
- Highlight color: Gold (#ffd700)
- Delete button: Red (#ff4757)
- Connection lines: Gray (#666) / Blue when highlighted (#4a90e2)

### Node Styling
- Border radius: 8px
- Box shadow on hover
- Transition: 0.2s ease for smooth interactions
- Inactive nodes: 50% opacity, gray background

## Known Configurations

### Line Routing
- `lineSpacing`: 16px
- `padding`: 30px
- `maxAttempts`: 200

### Node Dimensions
- Min width: 200px child, 250px main
- Max width: 250px
- Approximate height: 80px

### Canvas Defaults
- Default pan: { x: 600, y: 100 }
- Default zoom: 1.0
- Canvas size: 10000px x 10000px

## Future Considerations
- Save/Load functionality with file dialogs
- Export to various formats
- Undo/redo functionality
- Copy/paste nodes
- Keyboard shortcuts
- Search/filter nodes
- Collapse/expand all
- Different layout algorithms (radial, horizontal, etc.)
- Custom node colors/tags
- Notes/comments on nodes

## Bug Fixes Applied

1. **Event Listener Memory Leak**: Fixed useEffect dependency array causing multiple listener registrations
2. **Passive Event Listener Warning**: Wheel events now use manual addEventListener with passive:false
3. **Line Overlap Issues**: Improved routing algorithm with proper pre-positioning for left/right-going lines
4. **Double-click vs Click Conflict**: Proper event handling for single vs double-click actions

---

*Last Updated: December 26, 2025*
