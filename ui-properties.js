function updatePropertyEditor() {
    populateRightPropertyEditor();
}

// Context Menu Logic
let contextMenu = null;

function setupContextMenu() {
    if (contextMenu) return;
    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    document.body.appendChild(contextMenu);

    // Hide on global click
    window.addEventListener('click', () => {
        if (contextMenu) contextMenu.style.display = 'none';
    });

    // Hide on context menu elsewhere (optional, but prevents double menus)
    window.addEventListener('contextmenu', (e) => {
        if (!e.target.closest('.bind-button')) {
            if (contextMenu) contextMenu.style.display = 'none';
        }
    });
}

function showContextMenu(x, y, options) {
    if (!contextMenu) setupContextMenu();

    contextMenu.innerHTML = '';

    options.forEach(opt => {
        if (opt.separator) {
            const sep = document.createElement('div');
            sep.className = 'context-menu-separator';
            contextMenu.appendChild(sep);
        } else {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.textContent = opt.label;
            if (opt.disabled) {
                item.classList.add('disabled');
            } else {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    opt.action();
                    contextMenu.style.display = 'none';
                });
            }
            contextMenu.appendChild(item);
        }
    });

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = 'block';

    // Adjust if out of bounds
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = `${window.innerWidth - rect.width - 5}px`;
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = `${window.innerHeight - rect.height - 5}px`;
    }
}

function populateRightPropertyEditor() {
    const propertiesSidebar = document.getElementById('properties');
    const contentArea = propertiesSidebar.querySelector('.sidebar-content');
    contentArea.innerHTML = ''; // Clear existing content

    if (!selectedObject) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.padding = '1rem';
        emptyMsg.style.color = 'var(--text-secondary)';
        emptyMsg.style.fontStyle = 'italic';
        emptyMsg.textContent = 'Select an object';
        contentArea.appendChild(emptyMsg);
        return;
    }

    const nodeObject = selectedObject.nodeObject;
    if (!nodeObject || !nodeObject.attributes) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.padding = '1rem';
        emptyMsg.style.color = 'var(--text-secondary)';
        emptyMsg.style.fontStyle = 'italic';
        emptyMsg.textContent = 'No attributes found';
        contentArea.appendChild(emptyMsg);
        return;
    }

    const attributes = nodeObject.attributes;
    const attributeKeys = Object.keys(attributes);

    // Sort by order if available
    attributeKeys.sort((a, b) => {
        const orderA = attributes[a].order !== undefined ? attributes[a].order : 999;
        const orderB = attributes[b].order !== undefined ? attributes[b].order : 999;
        return orderA - orderB;
    });

    attributeKeys.forEach(key => {
        const attr = attributes[key];
        const row = document.createElement('div');

        const isBound = selectedObject.connections && selectedObject.connections.hasOwnProperty(key);
        // if its bound add a new class to the dif on top of 
        // property-row so that it shows a lighter background for bound attributes
        row.classList.add('property-row');
        if (isBound) {
            row.classList.add('bound-property-row');
        }

        // Bindable button or spacer
        if (attr.bindable) {
            const bindBtn = document.createElement('button');
            bindBtn.className = 'bind-button';
            bindBtn.title = 'Bind attribute';
            bindBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`Bind clicked for ${key}`);
                bindingSelectionMode = true;
                currentBindingProperty = key;
                setMousePointerMode("bindingSelection");
            });

            // Context Menu
            bindBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const isBound = selectedObject.connections && selectedObject.connections.hasOwnProperty(key);
                // if its bound add a new class to the dif on top of 
                // property-row so that it shows a lighter background for bound attributes
                if (isBound) {
                    row.className = 'bound-property-row';
                }
                const options = [
                    {
                        label: "Unbind",
                        disabled: !isBound,
                        action: () => {
                            console.log(`Remove bind clicked for ${key}`);
                            removeBinding(selectedObject, key);
                            // Refresh UI to show circle again
                            updatePropertyEditor();
                            refreshTheCanvas();
                        }
                    },
                    {
                        label: "Create Connection",
                        action: () => {
                            console.log(`Create Connection clicked for ${key}`);
                            bindingSelectionMode = true;
                            currentBindingProperty = key;
                            setMousePointerMode("bindingSelection");
                        }
                    },
                    {
                        label: "Connect to...",
                        action: () => {
                            console.log(`Connect to... clicked for ${key}`);
                            // Placeholder for future functionality
                            alert("Connect to... feature coming soon!");
                        }
                    }
                ];

                showContextMenu(e.clientX, e.clientY, options);
            });
            // Check the connections for this node to see if this attribute is bound
            const connections = selectedObject.connections;
            if (connections && connections.hasOwnProperty(key)) {
                // if its bound, change the shape to a square instead of a circle
                bindBtn.style.borderRadius = '0';
            }
            row.appendChild(bindBtn);
        } else {
            // Add spacer so labels align
            const spacer = document.createElement('div');
            spacer.className = 'bind-spacer';
            row.appendChild(spacer);
        }

        // Determine value
        const hasEditedValue = selectedObject.editedProperties && selectedObject.editedProperties.hasOwnProperty(key);
        const currentValue = hasEditedValue ? selectedObject.editedProperties[key] : attr.default;

        // Label
        const label = document.createElement('label');
        label.className = 'property-label';
        label.textContent = attr.metadata && attr.metadata.label ? attr.metadata.label : key;
        label.title = (attr.metadata && attr.metadata.comment) ? attr.metadata.comment :
            (attr.metadata && attr.metadata.label) ? attr.metadata.label :
                attr.attrType;
        if (hasEditedValue) {
            label.style.color = 'orange';
        }

        // Generate Input Container
        let inputContainer;
        const type = attr.attrType;

        const updateProperty = (val) => {
            let isInvalid = false;
            if (attr.attrType !== 'String') {
                if (typeof val === 'number' && isNaN(val)) {
                    isInvalid = true;
                } else if (Array.isArray(val)) {
                    const deepCheck = (v) => {
                        if (Array.isArray(v)) return v.some(deepCheck);
                        return typeof v === 'number' && isNaN(v);
                    };
                    if (deepCheck(val)) isInvalid = true;
                }
            }

            if (isInvalid) {
                if (selectedObject.editedProperties && selectedObject.editedProperties.hasOwnProperty(key)) {
                    delete selectedObject.editedProperties[key];
                    if (deltaAccumulator[selectedObject.name] && deltaAccumulator[selectedObject.name].changes) {
                        delete deltaAccumulator[selectedObject.name].changes[key];
                    }
                }
                label.style.color = '';
                return;
            }

            if (!selectedObject.editedProperties) selectedObject.editedProperties = {};
            selectedObject.editedProperties[key] = val;
            label.style.color = 'orange';
            if (typeof addToDelta === 'function') {
                addToDelta(selectedObject, key, val);
            }
        };

        if (attr.enum) {
            // Enum Dropdown
            inputContainer = document.createElement('select');
            inputContainer.className = 'property-select';

            const enumEntries = Object.entries(attr.enum);
            enumEntries.sort((a, b) => a[1] - b[1]);

            enumEntries.forEach(([enumLabel, enumValue]) => {
                const option = document.createElement('option');
                option.value = enumValue;
                option.textContent = enumLabel;
                if (enumValue == currentValue) {
                    option.selected = true;
                }
                inputContainer.appendChild(option);
            });

            inputContainer.addEventListener('change', (e) => {
                let val = e.target.value;
                // Attempt to preserve number type if default was number
                if (typeof attr.default === 'number') {
                    val = parseFloat(val);
                }
                updateProperty(val);
            });

        } else if (type === 'Bool') {
            inputContainer = document.createElement('input');
            inputContainer.type = 'checkbox';
            inputContainer.checked = currentValue === true;
            inputContainer.addEventListener('change', (e) => {
                updateProperty(e.target.checked);
            });
        } else if (type === 'Int' || type === 'Float') {
            inputContainer = document.createElement('input');
            inputContainer.type = 'number';
            inputContainer.className = 'property-input';
            inputContainer.value = currentValue !== undefined ? currentValue : 0;
            if (type === 'Float') inputContainer.step = '0.1';

            inputContainer.addEventListener('input', (e) => {
                const val = type === 'Int' ? parseInt(e.target.value) : parseFloat(e.target.value);
                updateProperty(val);
            });
        } else if (type === 'Rgb') {
            // Color Swatch + RGB Inputs
            inputContainer = document.createElement('div');
            inputContainer.className = 'rgb-container';

            const val = Array.isArray(currentValue) ? currentValue : [1.0, 1.0, 1.0];

            const getArray = () => {
                if (selectedObject.editedProperties && selectedObject.editedProperties[key]) {
                    return selectedObject.editedProperties[key];
                }
                return [...val];
            };

            const to255 = (v) => Math.min(255, Math.max(0, Math.round(v * 255)));
            const rgbToHex = (r, g, b) => {
                return "#" + [r, g, b].map(x => {
                    const hex = to255(x).toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('');
            };

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.className = 'color-swatch';
            colorInput.value = rgbToHex(val[0], val[1], val[2]);

            inputContainer.appendChild(colorInput);

            const numInputs = [];
            ['R', 'G', 'B'].forEach((channel, idx) => {
                const numInput = document.createElement('input');
                numInput.type = 'number';
                numInput.className = 'rgb-input';
                numInput.step = '0.01';
                numInput.value = val[idx].toFixed(3);
                numInput.title = channel;
                inputContainer.appendChild(numInput);
                numInputs.push(numInput);

                numInput.addEventListener('input', () => {
                    const arr = getArray();
                    arr[idx] = parseFloat(numInput.value);
                    updateProperty(arr);
                    colorInput.value = rgbToHex(arr[0], arr[1], arr[2]);
                });
            });

            colorInput.addEventListener('input', (e) => {
                const hex = e.target.value;
                const r = parseInt(hex.substr(1, 2), 16) / 255;
                const g = parseInt(hex.substr(3, 2), 16) / 255;
                const b = parseInt(hex.substr(5, 2), 16) / 255;

                const arr = getArray();
                arr[0] = r;
                arr[1] = g;
                arr[2] = b;
                updateProperty(arr);

                numInputs[0].value = r.toFixed(3);
                numInputs[1].value = g.toFixed(3);
                numInputs[2].value = b.toFixed(3);
            });

        } else if (type === 'Mat4d') {
            // 4x4 Matrix
            inputContainer = document.createElement('div');
            inputContainer.className = 'matrix-container';

            const val = Array.isArray(currentValue) ? currentValue : [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ];

            const getMatrix = () => {
                if (selectedObject.editedProperties && selectedObject.editedProperties[key]) {
                    return selectedObject.editedProperties[key];
                }
                return val.map(row => [...row]);
            };

            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    const matInput = document.createElement('input');
                    matInput.type = 'number';
                    matInput.className = 'matrix-input';
                    matInput.step = '0.01';
                    const v = (val[i] && val[i][j] !== undefined) ? val[i][j] : (i === j ? 1 : 0);
                    matInput.value = v;

                    matInput.addEventListener('input', (e) => {
                        const mat = getMatrix();
                        if (!mat[i]) mat[i] = [];
                        mat[i][j] = parseFloat(e.target.value);
                        updateProperty(mat);
                    });
                    inputContainer.appendChild(matInput);
                }
            }
        } else if (type === 'Vec3f' || type === 'Vec2f') {
            inputContainer = document.createElement('div');
            inputContainer.className = 'vec-container';

            const isVec3 = type === 'Vec3f';
            const val = Array.isArray(currentValue) ? currentValue : (isVec3 ? [0, 0, 0] : [0, 0]);
            const labels = isVec3 ? ['X', 'Y', 'Z'] : ['X', 'Y'];

            const getVec = () => {
                if (selectedObject.editedProperties && selectedObject.editedProperties[key]) {
                    return selectedObject.editedProperties[key];
                }
                return [...val];
            };

            labels.forEach((axis, idx) => {
                const numInput = document.createElement('input');
                numInput.type = 'number';
                numInput.className = 'vec-input';
                numInput.step = '0.01';
                numInput.value = val[idx] !== undefined ? val[idx] : 0;
                numInput.title = axis;
                numInput.placeholder = axis;

                numInput.addEventListener('input', (e) => {
                    const vec = getVec();
                    vec[idx] = parseFloat(e.target.value);
                    updateProperty(vec);
                });

                inputContainer.appendChild(numInput);
            });
        } else if (type === 'String') {
            if (attr.filename) {
                inputContainer = document.createElement('div');
                inputContainer.className = 'string-container';
                inputContainer.style.display = 'flex';
                inputContainer.style.width = '100%';
                inputContainer.style.gap = '5px';

                const textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.className = 'property-input';
                textInput.style.flexGrow = '1';
                let val = currentValue !== undefined ? currentValue : '';
                textInput.value = val;

                textInput.addEventListener('input', (e) => {
                    updateProperty(e.target.value);
                });

                const browseBtn = document.createElement('button');
                browseBtn.textContent = '...';
                browseBtn.className = 'browse-button';
                browseBtn.title = 'Browse File';
                browseBtn.style.padding = '0 10px';
                browseBtn.style.cursor = 'pointer';
                browseBtn.style.backgroundColor = '#444';
                browseBtn.style.color = '#fff';
                browseBtn.style.border = '1px solid #555';
                browseBtn.style.borderRadius = '4px';

                browseBtn.onclick = () => {
                    let extensions = [];
                    if (attr.metadata && attr.metadata.comment) {
                        const comment = attr.metadata.comment;
                        // Find extensions like .exr, .tx
                        const extMatches = comment.match(/\.[a-zA-Z0-9]{2,4}\b/g);
                        if (extMatches) {
                            extensions = extensions.concat(extMatches);
                        }
                        // Check for USD
                        if (comment.toLowerCase().includes("usd")) {
                            extensions.push(".usd", ".usda", ".usdc", ".usdz");
                        }
                        // Check for VDB
                        if (comment.toLowerCase().includes("vdb")) {
                            extensions.push(".vdb");
                        }
                    }
                    // Deduplicate extensions
                    extensions = [...new Set(extensions)];
                    const fileTypes = extensions.length > 0 ? extensions : 'all';

                    fileBrowser.open((path) => {
                        textInput.value = path;
                        updateProperty(path);
                    }, '.', fileTypes);
                };

                inputContainer.appendChild(textInput);
                inputContainer.appendChild(browseBtn);
            } else {
                inputContainer = document.createElement('input');
                inputContainer.type = 'text';
                inputContainer.className = 'property-input';
                let val = currentValue !== undefined ? currentValue : '';
                inputContainer.value = val;

                inputContainer.addEventListener('input', (e) => {
                    updateProperty(e.target.value);
                });
            }
        } else {
            inputContainer = document.createElement('input');
            inputContainer.type = 'text';
            inputContainer.className = 'property-input';
            let val = currentValue !== undefined ? currentValue : '';
            if (typeof val === 'object') val = JSON.stringify(val);
            inputContainer.value = val;

            inputContainer.addEventListener('input', (e) => {
                updateProperty(e.target.value);
            });
        }

        // Layout Logic
        const isComplex = attr.enum || type === 'Vec3f' || type === 'Vec2f' || type === 'Mat4d' || type === 'Rgb' || (type === 'String' && attr.filename);

        if (isComplex) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.width = '100%';

            label.style.marginBottom = '4px';
            wrapper.appendChild(label);

            if (inputContainer) {
                // Right align inputs for complex types (except maybe Mat4d which is full width grid)
                if (type !== 'Mat4d') {
                    inputContainer.style.width = '100%';
                    if (inputContainer.style.display !== 'grid') { // Don't override grid
                        inputContainer.style.display = 'flex';
                        inputContainer.style.justifyContent = 'flex-end';
                    }
                }
                wrapper.appendChild(inputContainer);
            }

            // Align row items to top so bind button stays at top
            row.style.alignItems = 'flex-start';
            // Add some top padding to bind button to align with label text if needed
            // But usually flex-start is enough.

            row.appendChild(wrapper);
        } else {
            row.appendChild(label);
            row.appendChild(inputContainer);
        }

        contentArea.appendChild(row);
    });

    if (selectedObject.className === 'Layer') {
        createLayerEditor(contentArea, selectedObject);
    }
}
