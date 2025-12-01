
function createLayerEditor(container, layerObject) {
    container.innerHTML = ''; // Clear existing content

    const editorContainer = document.createElement('div');
    editorContainer.className = 'layer-editor';
    container.appendChild(editorContainer);

    // Parse geometry from comments
    const geometryList = [];
    //for each node in listOfObjects
    listOfObjects.forEach(node => {
        if (node.nodeObject.type === "Geometry")
            geometryList.push(node);
    });

    // Create Table
    const table = document.createElement('table');
    table.className = 'layer-editor-table';
    editorContainer.appendChild(table);

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
        "Geometry", "Part", "Surface Shader", "Light Set",
        "Displacement", "Volume Shader", "Light Filter Set",
        "Shadow Set", "Shadow Receiver Set"
    ];
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // Populate rows
    // For now, we assume the rows correspond to the geometry list.
    // In a real app, we might merge with existing data in layerObject.

    // Initialize editedProperties if needed
    if (!layerObject.editedProperties) {
        layerObject.editedProperties = {};
    }

    // Helper to get current value
    const getValue = (attrName, index) => {
        const prop = layerObject.editedProperties[attrName] || layerObject.nodeObject.attributes[attrName].default;
        return prop && prop[index] ? prop[index] : "";
    };

    // Helper to set value
    const setValue = (attrName, index, value) => {
        if (!layerObject.editedProperties[attrName]) {
            // Initialize with default if not present
            // Note: This is a simplification. Deep copy might be needed.
            layerObject.editedProperties[attrName] = [...(layerObject.nodeObject.attributes[attrName].default || [])];
        }
        // Ensure array is long enough
        while (layerObject.editedProperties[attrName].length <= index) {
            layerObject.editedProperties[attrName].push("");
        }
        layerObject.editedProperties[attrName][index] = value;
    };

    geometryList.forEach((geo, index) => {
        const tr = document.createElement('tr');

        // Geometry Column (Read-only/Fixed for this exercise)
        const tdGeo = document.createElement('td');
        tdGeo.textContent = geo.className + "(\"" + geo.name + "\")";
        tr.appendChild(tdGeo);

        // Ensure geometry is set in the object
        setValue('geometries', index, geo);

        // Part
        const tdPart = document.createElement('td');
        const inputPart = document.createElement('input');
        inputPart.type = 'text';
        inputPart.value = getValue('parts', index);
        inputPart.addEventListener('change', (e) => setValue('parts', index, e.target.value));
        tdPart.appendChild(inputPart);
        tr.appendChild(tdPart);

        // Surface Shader (Material) - Right Click Menu
        const tdMat = document.createElement('td');
        const inputMat = document.createElement('input');
        inputMat.type = 'text';
        inputMat.value = getValue('surface_shaders', index);
        inputMat.readOnly = true; // Make it read-only, set via menu
        inputMat.placeholder = "Right-click to set";

        inputMat.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showMaterialContextMenu(e.clientX, e.clientY, (selectedMaterial) => {
                inputMat.value = selectedMaterial;
                setValue('surface_shaders', index, selectedMaterial);
            });
        });

        tdMat.appendChild(inputMat);
        tr.appendChild(tdMat);

        // Other columns (Generic inputs for now)
        const otherCols = [
            'lightsets', 'displacements', 'volume_shaders',
            'lightfiltersets', 'shadowsets', 'shadowreceiversets'
        ];

        otherCols.forEach(col => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = getValue(col, index);
            input.addEventListener('change', (e) => setValue(col, index, e.target.value));
            td.appendChild(input);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function showMaterialContextMenu(x, y, callback) {
    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.display = 'block';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    // Get materials from listOfObjects
    // Assuming listOfObjects is global from index.js
    const materials = listOfObjects.filter(obj => {
        // Simple heuristic to find materials. 
        // Adjust based on actual RDL types.
        return obj.type.includes('Material') || obj.type.includes('Shader');
    });

    if (materials.length === 0) {
        const item = document.createElement('div');
        item.className = 'context-menu-item disabled';
        item.textContent = "No materials found";
        menu.appendChild(item);
    } else {
        materials.forEach(mat => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.textContent = mat.name;
            item.addEventListener('click', () => {
                callback(mat.name);
                document.body.removeChild(menu);
            });
            menu.appendChild(item);
        });
    }

    // Add "Clear" option
    const clearItem = document.createElement('div');
    clearItem.className = 'context-menu-item';
    clearItem.textContent = "Clear";
    clearItem.style.borderTop = "1px solid #444";
    clearItem.addEventListener('click', () => {
        callback("");
        document.body.removeChild(menu);
    });
    menu.appendChild(clearItem);

    document.body.appendChild(menu);

    // Close on click outside
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
            window.removeEventListener('click', closeMenu);
        }
    };
    // Delay adding listener to avoid immediate close
    setTimeout(() => window.addEventListener('click', closeMenu), 0);
}