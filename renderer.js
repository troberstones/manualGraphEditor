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

// function to draw an individual rdlObject on the canvas
// this will need to handel the drawing of the connections, 
// the box and the text in the box as well as connection handles eventually
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
    ctx.fillStyle = "#ff8c00ff";
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
    if (listOfObjects) {
        for (const object of listOfObjects) {
            drawRdlObject(object);
            drawConnections(object);
        }
    }
}
