// rdlObject class
function RdlObject() {
    this.id = null;
    this.name = null;
    this.className = null;
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
