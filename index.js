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

    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
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

function readJsonFile(filename) {
    const file = new File(filename);
    const text = file.readText();
    const json = JSON.parse(text);
    return json;
}
// function to create an rdlObject from the specified on, and add it to the list of Objects
function createRdlObject(object) {
    // the new object should be initialized with a position that is centerd in the canvas. The canvas is scrollabel so we need to compute the active center
    // the active center needs to be relative to the current canvas offset
    var activeCenterX = canvas.width / 2 - canvas.offsetLeft;
    var activeCenterY = canvas.height / 2 - canvas.offsetTop;
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

}
// refreshTheCanvas function to clear the canvas and redraw all the objects
function refreshTheCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const object of listOfObjects) {
        drawRdlObject(object);
    }
}
// function to handle mouse events
// this will need to handle the selection of objects
// and the movement of objects
// TODO:
// - [handle mouse events ]
function handleMouseEvents() {

}

//function to populate the left hand column with a list of the objects from the rdl2Objects.json file
function populateLeftRDLObjectList() {
    //add a list of the objects from the rdl2Objects.json file to the left hand column  
    //this list should be searchable with a fuzzy logic search to make it easy to fine the items in the list
    //the list should be sortable by name
    //the list should be scrollable if there are too many items to fit on the screen
}
//function to populate the right hand column with a property editor for the selected object
//this funciton should be called when the user selects a node in the graph editor
function populateRightPropertyEditor() {

}
//function to handle the selection of objects
function handleSelection() {

}
// function to initialize the application
function init() {
    listOfObjects = [];
    rdl2Objects = readJsonFile("rdl2Objects.json");
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    // create a test object
    var testObject = new RdlObject();
    testObject.id = "testObject";
    testObject.name = "Test Object";
    testObject.type = "testObject";
    testObject.x = 100;
    testObject.y = 100;
    createRdlObject(testObject);

    refreshTheCanvas();
}