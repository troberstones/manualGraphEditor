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
