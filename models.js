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

// Layered Shader Data Structures
function LayeredShader(baseMaterial) {
    this.baseMaterial = baseMaterial || null;
    this.fillLayers = []; // List of FillLayer objects
}

function FillLayer() {
    this.masks = []; // List of LayerMask objects
    this.colorContribution = 1.0;
    this.heightContribution = 1.0;
    this.roughnessContribution = 1.0;
    this.roughness2Contribution = 1.0;
    this.metallicContribution = 1.0;
}

function LayerMask() {
    this.compositionMode = "add";
    this.percentage = 1.0;
}
