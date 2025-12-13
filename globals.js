const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const mainContainer = document.querySelector('main');

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
var deltaAccumulator = {}; // Stores accumulated deltas: { objectName: { className: "Type", changes: { attr: val } } }
