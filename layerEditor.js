
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
        const currentMat = getValue('surface_shaders', index);
        inputMat.value = (currentMat && currentMat.className && currentMat.name)
            ? `${currentMat.className}("${currentMat.name}")`
            : currentMat;

        inputMat.readOnly = true; // Make it read-only, set via menu
        inputMat.placeholder = "Right-click to set";

        inputMat.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showMaterialContextMenu(e.clientX, e.clientY, (selectedMaterial) => {
                const displayVal = (selectedMaterial && selectedMaterial.className && selectedMaterial.name)
                    ? `${selectedMaterial.className}("${selectedMaterial.name}")`
                    : selectedMaterial;
                inputMat.value = displayVal;
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
        if (!obj.type) return false;
        return obj.type.includes('Material') ||
            obj.type.includes('Shader') ||
            obj.type.includes('DwaBaseHairLayerable') ||
            obj.type.includes('DwaBaseLayerable');
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
            item.rdlobject = mat;
            item.addEventListener('click', () => {
                callback(mat);
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
    setTimeout(() => window.addEventListener('click', closeMenu), 0);
}

function updateLayerStackContainer() {
    const stackContainer = document.getElementById('layersStack').querySelector('.sidebar-content');
    stackContainer.innerHTML = '';

    if (!activeLayerMaterial) {
        const p = document.createElement('p');
        p.style.color = 'var(--text-secondary)';
        p.style.fontStyle = 'italic';
        p.textContent = 'No active layer material';
        stackContainer.appendChild(p);
        return;
    }

    if (!activeLayerMaterial.layeredShader) {
        // Init if missing
        activeLayerMaterial.layeredShader = new LayeredShader(activeLayerMaterial);
    }

    const ls = activeLayerMaterial.layeredShader;

    // Render Fill Layers (Newest on top)
    // We iterate backwards to render the top layers first
    for (let idx = ls.fillLayers.length - 1; idx >= 0; idx--) {
        const layer = ls.fillLayers[idx];
        const layerDiv = document.createElement('div');
        layerDiv.className = 'layer-stack-item fill-layer';

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'layer-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'layer-name';
        nameSpan.textContent = layer.name + ` (${idx + 1})`;
        nameSpan.contentEditable = true;
        nameSpan.addEventListener('blur', (e) => {
            layer.name = e.target.textContent.replace(` (${idx + 1})`, '');
        });

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'layer-actions';

        const maskBtn = document.createElement('button');
        maskBtn.className = 'mask-btn';
        maskBtn.title = 'Toggle Masks';
        maskBtn.textContent = 'M';

        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'settings-btn';
        settingsBtn.title = 'Component Settings';
        settingsBtn.textContent = 'S';
        settingsBtn.addEventListener('click', () => showFillComponentPopup(layer));

        actionsDiv.appendChild(maskBtn);
        actionsDiv.appendChild(settingsBtn);
        headerDiv.appendChild(nameSpan);
        headerDiv.appendChild(actionsDiv);
        layerDiv.appendChild(headerDiv);

        // Components
        const componentsDiv = document.createElement('div');
        componentsDiv.className = 'layer-components';

        const components = [
            { key: 'useColor', label: 'Color' },
            { key: 'useRoughness', label: 'Rgh' },
            { key: 'useRoughness2', label: 'Rgh2' },
            { key: 'useMetallic', label: 'Met' },
            { key: 'useHeight', label: 'Hgt' }
        ];

        components.forEach(comp => {
            const lbl = document.createElement('label');
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = layer[comp.key];
            chk.addEventListener('change', (e) => {
                layer[comp.key] = e.target.checked;
            });
            lbl.appendChild(chk);
            lbl.appendChild(document.createTextNode(' ' + comp.label));
            componentsDiv.appendChild(lbl);
        });

        layerDiv.appendChild(componentsDiv);

        // Masks container
        const masksContainer = document.createElement('div');
        masksContainer.className = 'mask-stack-container hidden';

        maskBtn.addEventListener('click', () => {
            masksContainer.classList.toggle('hidden');
        });

        const renderMasks = () => {
            masksContainer.innerHTML = '';
            layer.masks.forEach((mask, mIdx) => {
                const maskItem = document.createElement('div');
                maskItem.className = 'mask-item';
                maskItem.textContent = `Mask ${mIdx + 1} (${mask.compositionMode})`;
                masksContainer.appendChild(maskItem);
            });

            const addMaskBtn = document.createElement('button');
            addMaskBtn.className = 'add-mask-btn';
            addMaskBtn.textContent = '+ Add Mask';
            addMaskBtn.addEventListener('click', () => {
                layer.masks.push(new LayerMask());
                renderMasks();
            });
            masksContainer.appendChild(addMaskBtn);
        };
        renderMasks();

        layerDiv.appendChild(masksContainer);

        stackContainer.appendChild(layerDiv);
    }

    // Render Base Material last (bottom of the list)
    const baseDiv = document.createElement('div');
    baseDiv.className = 'layer-stack-item base-material';
    baseDiv.textContent = `Base: ${ls.baseMaterial.name} (${ls.baseMaterial.className})`;
    stackContainer.appendChild(baseDiv);
}

function showFillComponentPopup(fillLayer) {
    // Basic modal for selecting nodes/parameters
    const overlay = document.createElement('div');
    overlay.className = 'popup-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'popup-modal';

    const header = document.createElement('div');
    header.className = 'popup-modal-header';
    const title = document.createElement('span');
    title.textContent = `Component Settings - ${fillLayer.name}`;
    const closeBtn = document.createElement('span');
    closeBtn.className = 'popup-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    const components = ['color', 'roughness', 'roughness2', 'metallic', 'height'];

    components.forEach(comp => {
        const row = document.createElement('div');
        row.className = 'popup-modal-row';

        const lbl = document.createElement('label');
        lbl.textContent = comp.charAt(0).toUpperCase() + comp.slice(1);

        // Node selection
        const nodeSelect = document.createElement('select');
        const emptyOpt = document.createElement('option');
        emptyOpt.value = "";
        emptyOpt.textContent = "None";
        nodeSelect.appendChild(emptyOpt);

        listOfObjects.forEach(obj => {
            const opt = document.createElement('option');
            opt.value = obj.id;
            opt.textContent = obj.name;
            if (fillLayer.components[comp].sourceNodeId === obj.id) {
                opt.selected = true;
            }
            nodeSelect.appendChild(opt);
        });

        nodeSelect.addEventListener('change', (e) => {
            fillLayer.components[comp].sourceNodeId = e.target.value || null;
        });

        // Target Parameter selection
        const paramSelect = document.createElement('select');
        // Very simplistic option list, assuming standard parameters
        const baseParams = ['albedo', 'roughness', 'roughness2', 'metallic', 'height', 'bump_normal'];
        baseParams.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            if (fillLayer.components[comp].targetParameter === p) {
                opt.selected = true;
            }
            paramSelect.appendChild(opt);
        });

        paramSelect.addEventListener('change', (e) => {
            fillLayer.components[comp].targetParameter = e.target.value;
        });

        row.appendChild(lbl);
        row.appendChild(nodeSelect);
        row.appendChild(paramSelect);
        modal.appendChild(row);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}