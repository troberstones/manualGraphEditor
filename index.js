const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const mainContainer = document.querySelector('main');

function resizeCanvas() {
    canvas.width = mainContainer.clientWidth;
    canvas.height = mainContainer.clientHeight;
    draw();
}

function draw() {
    // Clear background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    const gridSize = 50;

    ctx.beginPath();
    // Vertical lines
    let startX = canvasOffsetX % gridSize;
    if (startX > 0) startX -= gridSize;
    for (let x = startX; x <= canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }

    // Horizontal lines
    let startY = canvasOffsetY % gridSize;
    if (startY > 0) startY -= gridSize;
    for (let y = startY; y <= canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

window.addEventListener('resize', resizeCanvas);
// Initial resize
resizeCanvas();


// TODO: 
// - [load the rdl2Objects.json file    ] 
// - [populate the left hand column with a list of the ojects from the rdl2Objects.json file ] 
// - [make a right hand column property editor ] 
// - [make a canvas to draw the graph on ] 
// - [add subroutines to draw a box in the canvas ]
// - [add subroutines to draw a line in the canvas  ]
// - [add a function to handle mouse events so that the user can click on the box and move it around 
var rdl2Objects = null;
var listOfObjects = null; // this contains the objects that have been created in the project.
var setOfNames = null;

var nodeWidth = 100;
var nodeHeight = 50;

var selectedObject = null;
var isDragging = false;
var isDraggingCanvas = false;
var dragOffsetX = 0;
var dragOffsetY = 0;
var canvasOffsetX = 0;
var canvasOffsetY = 0;
var lastMouseX = 0;
var lastMouseY = 0;
var bindingSelectionMode = false;
var currentBindingProperty = null;

// rdlObject class
function RdlObject() {
    this.id = null;
    this.name = null;
    this.type = null;
    this.x = null;
    this.y = null;
    // the width of a node is defined globally.
    this.height = nodeHeight;
    this.connections = {};
    this.nodeObject = null;
    this.editedProperties = {};
}
function NodeConnection(attributeName, sourceNode) {
    this.attributeName = attributeName;
    this.sourceNode = sourceNode;
}

async function readJsonFile(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error("Could not load JSON file:", filename, e);
        return null;
    }
}
// function to create an rdlObject from the specified on, and add it to the list of Objects
function createRdlObject(object, name) {
    // the new object should be initialized with a position that is centerd in the canvas. The canvas is scrollabel so we need to compute the active center
    // the active center needs to be relative to the current canvas offset
    var activeCenterX = (canvas.width / 2) - canvasOffsetX - (nodeWidth / 2);
    var activeCenterY = (canvas.height / 2) - canvasOffsetY - (nodeHeight / 2);
    var rdlObject = new RdlObject();
    rdlObject.id = object.id;// todo what do i want to do with the ID?
    rdlObject.type = object.type;
    rdlObject.x = activeCenterX;
    rdlObject.y = activeCenterY;
    rdlObject.nodeObject = object;
    tmpName = name;
    if (setOfNames === null) {
        setOfNames = [];
    }
    var iterCount = 0;
    while (setOfNames.includes(tmpName)) {
        tmpName = name + "_" + iterCount;
        iterCount++;
    }
    rdlObject.name = tmpName;
    setOfNames.push(tmpName);
    listOfObjects.push(rdlObject);
    // retunr the last object pushed onto the list
    return listOfObjects[listOfObjects.length - 1];
}
// function to draw an individual rdlObject on the canvas
// this will need to handel the drawing of the connections, 
// the box and the text in the box as well as connection handles eventually
// TODO:
// - [draw the box ]
// - [draw the text ]
// - [draw the connections ]
// - [draw the connection handles ]
function drawRdlObject(object) {
    const drawX = object.x + canvasOffsetX;
    const drawY = object.y + canvasOffsetY;

    // if selected, then draw a light outline around the object.
    ctx.fillStyle = "#333";
    if (object === selectedObject) {
        ctx.strokeStyle = "#b3acacff";
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, nodeWidth, nodeHeight);
    }
    ctx.fillRect(drawX, drawY, nodeWidth, nodeHeight);
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(object.name, drawX + nodeWidth / 2, drawY + nodeHeight / 2);
}
// function to draw a line between the left edge of a node and the right edge of the connected node
function drawConnections(object) {
    const drawX = object.x + canvasOffsetX;
    const drawY = object.y + canvasOffsetY;
    for (const key in object.connections) {
        const sourceNode = object.connections[key].sourceNode;
        const sourceDrawX = sourceNode.x + canvasOffsetX;
        const sourceDrawY = sourceNode.y + canvasOffsetY;
        ctx.strokeStyle = "#e5de9aff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sourceDrawX + nodeWidth, sourceDrawY + nodeHeight / 2);
        ctx.lineTo(drawX, drawY + nodeHeight / 2);
        ctx.stroke();
    }
}
// refreshTheCanvas function to clear the canvas and redraw all the objects
function refreshTheCanvas() {
    draw();
    for (const object of listOfObjects) {
        drawRdlObject(object);
        drawConnections(object);
    }
}
// function to handle mouse events
// this will need to handle the selection of objects
// and the movement of objects
// TODO:
// - [handle mouse events ]
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

//function to populate the left hand column with a list of the objects from the rdl2Objects.json file
//function to populate the left hand column with a list of the objects from the rdl2Objects.json file
function populateLeftRDLObjectList() {
    if (!rdl2Objects || !rdl2Objects.scene_classes) {
        console.warn("No RDL objects found to populate list.");
        return;
    }

    const objectListSidebar = document.getElementById('objectList');
    const contentArea = objectListSidebar.querySelector('.sidebar-content');

    // Clear existing content
    contentArea.innerHTML = '';

    // Create Search Bar
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Search objects...';

    searchContainer.appendChild(searchInput);

    // Remove existing search container if any (to prevent duplicates)
    const existingSearch = objectListSidebar.querySelector('.search-container');
    if (existingSearch) {
        existingSearch.remove();
    }

    // Insert after header
    const header = objectListSidebar.querySelector('.sidebar-header');
    header.after(searchContainer);

    // Get list of objects and sort them
    const objectNames = Object.keys(rdl2Objects.scene_classes).sort((a, b) => a.localeCompare(b));

    // Create list container
    const listContainer = document.createElement('div');
    listContainer.className = 'object-list';
    contentArea.appendChild(listContainer);

    // Function to render list items
    function renderItems(filter = '') {
        listContainer.innerHTML = '';
        const lowerFilter = filter.toLowerCase();

        objectNames.forEach(name => {
            if (name.toLowerCase().includes(lowerFilter)) {
                const item = document.createElement('div');
                item.className = 'object-list-item';
                item.textContent = name;

                item.addEventListener('click', (e) => {
                    // Deselect others
                    const selected = listContainer.querySelectorAll('.selected');
                    selected.forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');

                    // when double clicked, create a new object of this type.
                    if (e.detail === 2) {
                        console.log('Double clicked object type:', name);
                        createRdlObject(rdl2Objects.scene_classes[name], name);
                        refreshTheCanvas();
                    } else {
                        console.log('Single clicked object type:', name);
                    }
                });

                listContainer.appendChild(item);
            }
        });

        if (listContainer.children.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.padding = '1rem';
            emptyMsg.style.color = 'var(--text-secondary)';
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.textContent = 'No matching objects found';
            listContainer.appendChild(emptyMsg);
        }
    }

    // Initial render
    renderItems();

    // Search event listener
    searchInput.addEventListener('input', (e) => {
        renderItems(e.target.value);
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
function updatePropertyEditor() {
    populateRightPropertyEditor();
}
//function to populate the right hand column with a property editor for the selected object
//this funciton should be called when the user selects a node in the graph editor

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
        row.className = 'property-row';

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
                    row.classList.add('bound');
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
        label.title = key; // Tooltip with full key
        if (hasEditedValue) {
            label.style.color = 'orange';
        }

        // Generate Input Container
        let inputContainer;
        const type = attr.attrType;

        const updateProperty = (val) => {
            if (!selectedObject.editedProperties) selectedObject.editedProperties = {};
            selectedObject.editedProperties[key] = val;
            label.style.color = 'orange';
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
                    arr[idx] = parseFloat(numInput.value) || 0;
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
                        mat[i][j] = parseFloat(e.target.value) || 0;
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
                    vec[idx] = parseFloat(e.target.value) || 0;
                    updateProperty(vec);
                });

                inputContainer.appendChild(numInput);
            });
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
        const isComplex = attr.enum || type === 'Vec3f' || type === 'Vec2f' || type === 'Mat4d' || type === 'Rgb';

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
}
function createNodeConnection(node, attributeName, sourceNode) {
    node.connections[attributeName] = new NodeConnection(attributeName, sourceNode);
}
function removeBinding(node, attributeName) {
    delete node.connections[attributeName];
}
// function to initialize the application
async function init() {
    listOfObjects = [];
    rdl2Objects = await readJsonFile("rdl2Objects.json");
    // create a rdl2 BaseMaterial object
    var baseMaterial = createRdlObject(rdl2Objects.scene_classes["BaseMaterial"], "Test Base Material");
    var blendMap = createRdlObject(rdl2Objects.scene_classes["BlendMap"], "Test BlendMap");
    createNodeConnection(baseMaterial, "diffuse_color", blendMap);

    refreshTheCanvas();

    // Populate the list
    if (rdl2Objects) {
        populateLeftRDLObjectList();
    }

    setupMouseEvents();
    setupContextMenu();
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', init);