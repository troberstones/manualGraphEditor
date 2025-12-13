// function to handle mouse events
// this will need to handle the selection of objects
// and the movement of objects
function setupMouseEvents() {
    canvas.addEventListener('mousedown', function (e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Convert mouse to world space for object checking
        const worldX = mouseX - canvasOffsetX;
        const worldY = mouseY - canvasOffsetY;

        // Check if we clicked on an object
        // Iterate in reverse order to select the top-most object if they overlap
        let clickedObject = null;
        for (let i = listOfObjects.length - 1; i >= 0; i--) {
            const obj = listOfObjects[i];
            if (worldX >= obj.x && worldX <= obj.x + nodeWidth &&
                worldY >= obj.y && worldY <= obj.y + nodeHeight) {
                clickedObject = obj;
                break;
            }
        }

        if (clickedObject) {
            if (bindingSelectionMode) {
                createNodeConnection(selectedObject, currentBindingProperty, clickedObject);
                bindingSelectionMode = false;
                currentBindingProperty = null;
                updatePropertyEditor();
                resetMousePointer();
            } else {
                selectedObject = clickedObject;
                isDragging = true;
                dragOffsetX = worldX - selectedObject.x;
                dragOffsetY = worldY - selectedObject.y;
                populateRightPropertyEditor();
            }
        } else {
            if (!bindingSelectionMode) {
                selectedObject = null;
                // clear the property editor if we deselect
                populateRightPropertyEditor();
            }
            isDraggingCanvas = true;
            lastMouseX = mouseX;
            lastMouseY = mouseY;
        }
        refreshTheCanvas();
    });

    canvas.addEventListener('mousemove', function (e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (isDragging && selectedObject) {
            selectedObject.x = mouseX - canvasOffsetX - dragOffsetX;
            selectedObject.y = mouseY - canvasOffsetY - dragOffsetY;
            refreshTheCanvas();
        } else if (isDraggingCanvas) {
            const dx = mouseX - lastMouseX;
            const dy = mouseY - lastMouseY;
            canvasOffsetX += dx;
            canvasOffsetY += dy;
            lastMouseX = mouseX;
            lastMouseY = mouseY;
            refreshTheCanvas();
        }
    });

    canvas.addEventListener('mouseup', function (e) {
        isDragging = false;
        isDraggingCanvas = false;
    });

    canvas.addEventListener('mouseleave', function (e) {
        isDragging = false;
        isDraggingCanvas = false;
    });
}

function setupKeyboardEvents() {
    document.addEventListener('keyup', function (e) {
        // checks if the user is typing in an input field
        const activeTag = document.activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') {
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedObject) {
                deleteSelectedObject();
            }
        }
    });
}

function deleteSelectedObject() {
    if (!selectedObject) return;

    // 1. Remove from listOfObjects
    const index = listOfObjects.indexOf(selectedObject);
    if (index > -1) {
        listOfObjects.splice(index, 1);
    }

    // Remove from setOfNames
    const nameIndex = setOfNames.indexOf(selectedObject.name);
    if (nameIndex > -1) {
        setOfNames.splice(nameIndex, 1);
    }

    // Remove from deltaAccumulator if present
    if (deltaAccumulator && deltaAccumulator[selectedObject.name]) {
        delete deltaAccumulator[selectedObject.name];
    }

    // 2. Remove references to this object in other objects' connections
    listOfObjects.forEach(obj => {
        Object.keys(obj.connections).forEach(attrName => {
            const connection = obj.connections[attrName];
            if (connection.sourceNode === selectedObject) {
                removeBinding(obj, attrName);
            }
        });
    });

    // 3. Clear selection and update UI
    selectedObject = null;
    refreshTheCanvas();
    updatePropertyEditor();
}

function setMousePointerMode(mode) {
    switch (mode) {
        case "bindingSelection":
            canvas.style.cursor = 'crosshair';
            break;
        default:
            canvas.style.cursor = 'default';
            break;
    }
}

function resetMousePointer() {
    canvas.style.cursor = 'default';
}
