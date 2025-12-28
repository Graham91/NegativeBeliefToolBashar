# Belief System App - Project Documentation

## Overview
An Electron-based React application for visualizing and managing hierarchical belief systems using an interactive tree structure.

## Project Structure

```
my-react-electron-app/
├── src/
│   ├── App.jsx                 # Main application component with multi-view management
│   ├── App.css                 # Global styles
│   ├── index.js                # Main Electron process
│   ├── preload.js              # Electron preload script
│   ├── renderer.jsx            # React renderer entry point
│   └── components/
│       ├── TreeView.jsx        # Main tree visualization component
│       ├── MainQuestion.jsx    # Root node component
│       ├── ChildQuestion.jsx   # Child node component
│       ├── EditMainModal.jsx   # Modal for editing main question
│       ├── EditChildModal.jsx  # Modal for editing child questions
│       └── ProjectManager.jsx  # Project creation and management interface
├── forge.config.js
├── package.json
└── webpack.config.js
```

## Core Features

### 1. Project Manager
- **Multi-Project Support**: Create, manage, and switch between multiple belief system projects
- **Project Operations**:
  - Create new projects with custom names
  - Rename existing projects (click pencil icon)
  - Delete projects with confirmation dialog
  - View all projects in a card-based grid layout
- **Project Cards**: Display project name and last modified date
- **Seamless Navigation**: Click "Back to Projects" button from tree view to return to project manager
- **Automatic Saving**: Projects auto-save before switching

### 2. Tree Visualization
- **Interactive Canvas**: Pan and zoom functionality for navigating large tree structures
- **Layer-based Layout**: Automatic positioning of nodes in hierarchical layers
- **Connection Lines**: Smart orthogonal line routing between parent and child nodes
- **Visual Hierarchy**: Main question (root) highlighted with purple gradient and gold border

### 2. Node Types

#### Main Question Node
- Purple gradient background with gold border
- Contains:
  - "Negative Belief" field - the core belief being examined
  - "Solution" field - the reframed positive belief or truth
  - Add Child button
- Cannot be deleted (root node)
- Single-click to select
- Double-click to edit
- Help icon (❓) provides guidance on writing solutions

#### Child Question Nodes
- White background with blue accents
- Contains:
  - "Previous Solution" field (inherited from parent's solution)
  - "Negative Belief" field (worst-case scenario if previous solution is true)
  - "Solution" field (positive reframe or truth)
  - Add Child button (+) in bottom-left
  - Hide/Show Children toggle (-) in bottom-right
  - Delete button (🗑 trash icon, top-right corner)
- Single-click to select and highlight path
- Double-click to edit
- Help icon (❓) in edit modal provides solution-writing tips

### 3. Node Management

#### Adding Children
- Click "+ Add Child" button on any node
- Creates new child with:
  - "If" field automatically populated with parent's Solution
  - Empty "Then" and "Solution" fields
- Automatically positioned in tree layout
- Unique ID generated using timestamp
- This creates a logical flow: parent's solution becomes the premise for exploring deeper beliefs

#### Editing Nodes
- Double-click any node to open edit modal
- Edit fields:
  - Main Question Modal:
    - Title: "What Must I Believe is true to feel like this?"
    - Negative Belief (textarea)
    - Solution (textarea with help icon)
  - Child Question Modal:
    - Interactive sentence format: "If [editable inline text] is true, the worst thing that would happen would be..."
    - Then field (textarea)
    - Solution field (textarea with help icon)
- Help tooltips provide guidance on writing effective solutions
- Changes saved in real-time to project data
- Press Enter or blur to save inline edits

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
- Mouse wheel to zoom in/out (with debounced smooth zooming)
- Zoom range: 10% to 300%
- Lower sensitivity for more precise control
- Accumulated delta with 150ms debounce for smooth zooming
- Zoom controls in bottom-right corner:
  - "+" button: Zoom in by 20%
  - "-" button: Zoom out by 20%
  - Percentage display
  - "Reset" button: Reset zoom to 100% and pan to (600, 100)
- Uses requestAnimationFrame for smooth performance

#### Top Controls
- "← Back to Projects" button: Returns to project manager (auto-saves current project)
- "💾 Save" button: Manually triggers project save
- Located in top-left corner of tree view

#### Additional Features
- Memoized line rendering for performance optimization
- Debug lines button available (commented out in code)

### 7. Auto-Save & Data Persistence

#### Auto-Save System
- **Automatic Saving**: Projects automatically save every 60 seconds while in tree view
- **Manual Save**: Click the save button (💾 Save) in the top-right corner for immediate save
- **Save on Navigation**: Automatically saves current project when returning to project manager
- **Console Feedback**: Logs save confirmations to console
- **Ref Pattern**: Uses React refs to ensure latest data is always saved

#### Data Persistence

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
- Vertical spacing: 350px between layers
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

#### App-Level State (App.jsx)
- `currentView`: Current application view ('projects' or 'tree')
- `currentProjectId`: ID of the currently loaded project
- `projectData`: Complete project data structure
- `projectDataRef`: Ref for accessing latest data in event listeners

#### TreeView State
- `zoom`: Current zoom level (0.1 - 3.0)
- `zoomRef`: Ref to access current zoom in event listeners
- `pan`: Canvas pan position {x, y}
- `isDragging`: Pan drag state
- `dragStart`: Starting position for drag operations
- `editingNode`: Currently edited node (opens modal)
- `selectedNode`: Currently selected node ID (for path highlighting)
- `nodePositions`: Calculated positions for all visible nodes

#### ProjectManager State
- `projects`: Array of all available projects
- `newProjectName`: Name input for creating new project
- `editingProject`: Project currently being renamed
- `editedName`: New name being entered during rename

### Event Handling

#### Electron IPC Events (App.jsx)
- `file-opened`: Handles file open operations
- `project-loaded`: Loads project data and switches to tree view
- `request-save-data`: Responds to save requests from main process
- `file-saved`: Confirms successful file save operations
- `projects-updated`: Updates project list in ProjectManager
- All listeners properly cleaned up in useEffect return functions

#### Wheel Events
- Custom event listener with `{ passive: false }` option
- Debounced with 100ms delay for smooth zooming
- Accumulated delta approach for precise control
- requestAnimationFrame for optimal performance
- Allows preventDefault() for zoom control
- Properly cleaned up in useEffect

#### Click Events
- Single-click: Node selection and path highlighting
- Double-click: Open edit modal
- Button clicks use stopPropagation() to prevent parent handlers
- Enter key: Saves inline edits in child modal
- Escape key: Cancels project rename operation

### Performance Optimizations
- useEffect dependencies carefully managed
- Ref pattern for projectData and zoom to prevent listener re-registration
- Position calculations only on projectData changes
- Line routing cached in assignedSegments
- useMemo for line rendering to avoid recalculation on zoom changes
- Debounced wheel events with requestAnimationFrame for smooth zooming
- Auto-save interval cleared when leaving tree view
- Event listeners properly cleaned up to prevent memory leaks

## Styling

### Color Scheme
- Background: Dark blue gradient (#1a1a2e to #16213e)
- Main node: Purple gradient (#667eea to #764ba2) with gold border
- Child nodes: White (#ffffff) with blue accents
- Accent color: Blue (#4a90e2)
- Highlight color: Gold (#ffd700)
- Delete button: Red (#ff4757)
- Connection lines: Gray (#666) / Blue when highlighted (#4a90e2)
- Inactive nodes: Gray background (#ccc) with 50% opacity
- Help icon: Yellow (#ffd700)
- Modal overlay: Semi-transparent dark background

### Node Styling
- Border radius: 8px (nodes), 50% (circular buttons)
- Box shadow on hover
- Transition: 0.2s ease for smooth interactions
- Inactive nodes: 50% opacity, gray background
- Bottom action buttons: Circular design with + and - symbols
- Help icon: Clickable question mark with tooltip
- Labels and previews styled for readability
- HR separators between child node sections

## Known Configurations

### Line Routing
- `lineSpacing`: 16px
- `padding`: 30px
- `maxAttempts`: 200

### Node Dimensions
- Min width: 200px child, 250px main
- Max width: 250px
- Approximate height: Varies by content
- Node positioning offset: translate(-50%, 0) for centering

### Canvas Defaults
- Default pan: { x: 600, y: 100 }
- Default zoom: 1.0
- Canvas size: 10000px x 10000px

### Zoom Configuration
- Wheel sensitivity: 0.0005 (DOM_DELTA_PIXEL) or 0.001 (DOM_DELTA_LINE)
- Zoom multiplier: 4x accumulated delta
- Debounce delay: 100ms
- Button increment: 0.2 (20%)
- Auto-save interval: 60000ms (60 seconds)

## Future Considerations
- Export to various formats (PDF, PNG, JSON)
- Undo/redo functionality for node operations
- Copy/paste nodes between projects
- Keyboard shortcuts for common operations
- Search/filter nodes by content
- Collapse/expand all nodes at once
- Different layout algorithms (radial, horizontal, mind map)
- Custom node colors/tags for categorization
- Notes/comments on nodes
- Import/merge projects
- Cloud sync or backup functionality
- Print view optimization

## Bug Fixes & Improvements Applied

### Bug Fixes
1. **Event Listener Memory Leak**: Fixed useEffect dependency array causing multiple listener registrations
2. **Passive Event Listener Warning**: Wheel events now use manual addEventListener with passive:false
3. **Line Overlap Issues**: Improved routing algorithm with proper pre-positioning for left/right-going lines
4. **Double-click vs Click Conflict**: Proper event handling for single vs double-click actions
5. **Zoom Jitter**: Implemented debounced zoom with refs to prevent state update loops
6. **Auto-save Timing**: Fixed interval cleanup when switching views

### Recent Improvements
1. **Project Management**: Complete project manager interface with CRUD operations
2. **Auto-Save System**: Automatic and manual save options with console feedback
3. **Improved UX**: Redesigned node content display with clear labels and sections
4. **Smart Child Creation**: Automatic population of If-field from parent's solution
5. **Help System**: Contextual help tooltips in edit modals
6. **Smooth Zoom**: Debounced wheel events for better zoom control
7. **Performance**: Memoized line rendering and optimized re-renders
8. **Navigation**: Seamless switching between project manager and tree view

---

*Last Updated: December 27, 2025*
