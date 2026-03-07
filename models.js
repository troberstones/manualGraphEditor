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
    this.name = "Fill Layer";
    this.masks = []; // List of LayerMask objects

    // Checkbox boolean toggles
    this.useColor = true;
    this.useHeight = false;
    this.useRoughness = false;
    this.useRoughness2 = false;
    this.useMetallic = false;

    // Contributions
    this.colorContribution = 1.0;
    this.heightContribution = 1.0;
    this.roughnessContribution = 1.0;
    this.roughness2Contribution = 1.0;
    this.metallicContribution = 1.0;

    // Data about node connections mapping to this layer
    this.components = {
        color: { sourceNodeId: null, targetParameter: "albedo" },
        height: { sourceNodeId: null, targetParameter: "height" },
        roughness: { sourceNodeId: null, targetParameter: "roughness" },
        roughness2: { sourceNodeId: null, targetParameter: "roughness2" },
        metallic: { sourceNodeId: null, targetParameter: "metallic" }
    };
}

function LayerMask() {
    this.compositionMode = "add";
    this.percentage = 1.0;
}
