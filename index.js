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

// rdlObject class
function RdlObject() {
    this.id = null;
    this.name = null;
    this.type = null;
    this.x = null;
    this.y = null;
    // the width of a node is defined globally.
    this.height = nodeHeight;
    this.connections = null;
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
function createRdlObject(object) {
    // the new object should be initialized with a position that is centerd in the canvas. The canvas is scrollabel so we need to compute the active center
    // the active center needs to be relative to the current canvas offset
    var activeCenterX = (canvas.width / 2) - canvasOffsetX - (nodeWidth / 2);
    var activeCenterY = (canvas.height / 2) - canvasOffsetY - (nodeHeight / 2);
    object.x = activeCenterX;
    object.y = activeCenterY;
    listOfObjects.push(object);
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
    console.log("Drawing object: " + object.name);
    ctx.fillRect(drawX, drawY, nodeWidth, nodeHeight);
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(object.name, drawX + nodeWidth / 2, drawY + nodeHeight / 2);
}
// refreshTheCanvas function to clear the canvas and redraw all the objects
function refreshTheCanvas() {
    draw();
    for (const object of listOfObjects) {
        drawRdlObject(object);
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
            selectedObject = clickedObject;
            isDragging = true;
            dragOffsetX = worldX - selectedObject.x;
            dragOffsetY = worldY - selectedObject.y;
            populateRightPropertyEditor();
        } else {
            selectedObject = null;
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

                item.addEventListener('click', () => {
                    // Deselect others
                    const selected = listContainer.querySelectorAll('.selected');
                    selected.forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');

                    console.log('Selected object type:', name);
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
//function to populate the right hand column with a property editor for the selected object
//this funciton should be called when the user selects a node in the graph editor
function populateRightPropertyEditor() {

}
//function to handle the selection of objects
function handleSelection() {

}
// function to initialize the application
// function to initialize the application
async function init() {
    listOfObjects = [];
    rdl2Objects = await readJsonFile("rdl2Objects.json");
    //canvas = document.getElementById("canvas");
    //ctx = canvas.getContext("2d");

    // create a test object
    var testObject = new RdlObject();
    testObject.id = "testObject";
    testObject.name = "Test Object";
    testObject.type = "testObject";
    testObject.x = 100;
    testObject.y = 100;
    createRdlObject(testObject);

    // create a test object2
    var testObject2 = new RdlObject();
    testObject2.id = "testObject2";
    testObject2.name = "Test Object 2";
    testObject2.type = "testObject2";
    testObject2.x = 150;
    testObject.y = 150;
    createRdlObject(testObject2);

    refreshTheCanvas();

    // Populate the list
    if (rdl2Objects) {
        populateLeftRDLObjectList();
    }

    setupMouseEvents();
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', init);