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
    rdlObject.className = object.class_name;
    rdlObject.name = tmpName;
    setOfNames.push(tmpName);
    listOfObjects.push(rdlObject);
    // retunr the last object pushed onto the list
    return listOfObjects[listOfObjects.length - 1];
}

function createNodeConnection(node, attributeName, sourceNode) {
    node.connections[attributeName] = new NodeConnection(attributeName, sourceNode);
}

function removeBinding(node, attributeName) {
    delete node.connections[attributeName];
}
