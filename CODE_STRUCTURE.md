# Code Structure & Architecture

This document outlines the modular structure of the Graph Editor application. The original monolithic `index.js` has been split into several focused modules to improve maintainability and organization.

## JavaScript Modules

| File | Description | Key Functions/Variables |
| :--- | :--- | :--- |
| **`globals.js`** | Global variables and shared state. | `listOfObjects`, `rdl2Objects`, `selectedObject`, Canvas config (`nodeWidth`, `canvasOffsetX`), Flags (`isDragging`, `bindingSelectionMode`) |
| **`models.js`** | Data classes and structure definitions. | `RdlObject` class, `NodeConnection` class |
| **`scene.js`** | Core scene graph management. | `createRdlObject`, `createNodeConnection`, `removeBinding` |
| **`renderer.js`** | Canvas rendering and visual representation. | `draw`, `refreshTheCanvas`, `drawRdlObject`, `drawConnections` |
| **`interaction.js`** | User input handling (Mouse/Keyboard). | `setupMouseEvents`, `setMousePointerMode` |
| **`ui-library.js`** | Left Sidebar (Object Library) logic. | `populateLeftRDLObjectList` |
| **`ui-properties.js`** | Right Sidebar (Property Editor) logic & Context Menus. | `populateRightPropertyEditor`, `setupContextMenu`, `updatePropertyEditor` |
| **`io.js`** | Networking, File I/O, and Serialization. | `saveSceneAsJson`, `loadSceneFromJson`, `setupRenderMenu`, `setupSaveMenu`, `setupFileMenu` |
| **`utils.js`** | General utility helper functions. | `readJsonFile`, `makeMat4`, `xform` |
| **`main.js`** | Application entry point and initialization. | `init`, `resizeCanvas`, Window event listeners |
| **`fileBrowser.js`** | File browser modal logic. | *Existing module* |
| **`layerEditor.js`** | Specialized editor for Layer objects. | *Existing module* |

## Loading Order

The modules must be loaded in `index.html` in an order that respects their dependencies. `globals.js`, `utils.js`, and `models.js` are foundational and must be loaded first. `main.js` depends on almost all other modules and is loaded last.

## Backend

| File | Description |
| :--- | :--- |
| **`host.py`** | Python web server handling file serving, JSON persistence (`loadSceneFromJson`, `saveSceneAsJson`), and RDLA generation (`writeRdla2File`). |
