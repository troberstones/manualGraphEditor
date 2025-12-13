const replacer = function (key, value) {
    if (key === 'nodeObject' && value) {
        return {
            name: value.class_name,
            className: value.class_name
        };
    }
    if (value instanceof NodeConnection) {
        return {
            name: value.sourceNode.name,
            className: value.sourceNode.className
        };
    }
    if (value instanceof RdlObject) {
        if (this === listOfObjects) {
            return value;
        }
        return {
            name: value.name,
            className: value.className
        };
    }
    return value;
};

function saveSceneAsJson(filePath) {
    // convert the listOfObjects to a string
    // strinify the json, but if the type is and RdlObject, just return the name and className
    const sceneJson = JSON.stringify(listOfObjects, replacer);
    // write the string to a file by sending it to the server with the output filepath.
    fetch('/saveSceneAsJson', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filePath: filePath,
            sceneJson: sceneJson
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });

}

function setupSaveMenu() {
    const saveMenu = document.getElementById('menu-save');
    if (saveMenu) {
        saveMenu.addEventListener('click', () => {
            //get file output path
            fileBrowser.open((path) => {
                console.log("File selected:", path);
                saveSceneAsJson(path);
            }, ".", "json", "save");
        });
    }
}
function setupFileMenu() {
    const fileMenu = document.getElementById('menu-file');
    if (fileMenu) {
        fileMenu.addEventListener('click', () => {
            fileBrowser.open((path) => {
                console.log("File selected:", path);
                loadSceneFromJson(path);
            }, ".", "json", "open");
        });
    }
}

function restoreSceneFromData(data) {
    if (!Array.isArray(data)) {
        console.error("Loaded data is not an array");
        return;
    }

    // Clear existing objects
    listOfObjects = [];
    setOfNames = [];
    selectedObject = null;

    // Pass 1: Create all objects
    data.forEach(objData => {
        const classDef = rdl2Objects.scene_classes[objData.className];
        if (classDef) {
            // createRdlObject adds to listOfObjects and setOfNames
            const newObj = createRdlObject(classDef, objData.name);

            // Restore properties
            newObj.x = objData.x;
            newObj.y = objData.y;
            if (objData.id) newObj.id = objData.id;

            // Temporarily store editedProperties (will resolve references later)
            newObj.editedProperties = objData.editedProperties || {};
        } else {
            console.warn(`Unknown class: ${objData.className}`);
        }
    });

    // Helper to resolve object references in editedProperties
    const resolveRefs = (val) => {
        if (!val) return val;
        if (Array.isArray(val)) {
            return val.map(item => resolveRefs(item));
        }
        if (typeof val === 'object') {
            if (val.name && val.className && Object.keys(val).length === 2) {
                const found = listOfObjects.find(o => o.name === val.name && o.className === val.className);
                if (found) return found;
            }
            const newVal = {};
            for (const key in val) {
                newVal[key] = resolveRefs(val[key]);
            }
            return newVal;
        }
        return val;
    };

    // Pass 2: Restore connections and resolve references
    data.forEach(objData => {
        const targetObj = listOfObjects.find(o => o.name === objData.name);
        if (targetObj) {
            // Restore connections
            if (objData.connections) {
                Object.keys(objData.connections).forEach(attrName => {
                    const connData = objData.connections[attrName];
                    const sourceObj = listOfObjects.find(o => o.name === connData.name);
                    if (sourceObj) {
                        createNodeConnection(targetObj, attrName, sourceObj);
                    }
                });
            }

            // Resolve references in editedProperties
            if (targetObj.editedProperties) {
                targetObj.editedProperties = resolveRefs(targetObj.editedProperties);
            }
        }
    });

    refreshTheCanvas();
}

function loadSceneFromJson(filePath) {
    fetch('/loadSceneFromJson', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filePath: filePath
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            restoreSceneFromData(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function saveLocalState() {
    const sceneJson = JSON.stringify(listOfObjects, replacer);
    localStorage.setItem('GRAPH_EDITOR_STATE', sceneJson);
}

function loadLocalState() {
    const sceneJson = localStorage.getItem('GRAPH_EDITOR_STATE');
    if (sceneJson) {
        try {
            const data = JSON.parse(sceneJson);
            restoreSceneFromData(data);
            return true;
        } catch (e) {
            console.error("Failed to parse local state", e);
            return false;
        }
    }
    return false;
}

function clearLocalState() {
    localStorage.removeItem('GRAPH_EDITOR_STATE');
}

function addToDelta(object, property, value) {
    if (!deltaAccumulator[object.name]) {
        deltaAccumulator[object.name] = {
            className: object.className,
            changes: {}
        };
    }
    deltaAccumulator[object.name].changes[property] = value;
    sendDelta();
}

function sendDelta() {
    fetch('/writeDeltaRdla', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(deltaAccumulator)
    })
        .catch((error) => {
            console.error('Error sending delta:', error);
        });
}

function setupRenderMenu() {
    const renderMenu = document.getElementById('menu-render');
    if (renderMenu) {
        renderMenu.addEventListener('click', () => {
            // Reset delta accumulator
            deltaAccumulator = {};
            // We also want to clear delta.rdla on server, sending empty object
            fetch('/writeDeltaRdla', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            }).catch(e => console.error("Error clearing delta:", e));

            if (!listOfObjects || listOfObjects.length === 0) {
                console.warn("No objects to render");
                alert("No objects to render");
                return;
            }

            const simplifiedObjects = listOfObjects.map(obj => {
                const connections = {};
                for (const key in obj.connections) {
                    connections[key] = {
                        attributeName: obj.connections[key].attributeName,
                        sourceNodeName: obj.connections[key].sourceNode.name
                    };
                }
                if (obj.className === "Layer") {
                    //shorten the geometry paramter to a list of strings of className("name")
                    const flattenedEditedProperties = {};
                    if (obj.editedProperties) {
                        Object.keys(obj.editedProperties).forEach(key => {
                            const value = obj.editedProperties[key];
                            if (Array.isArray(value)) {
                                flattenedEditedProperties[key] = value.map(item => {
                                    if (item && item.className && item.name) {
                                        return `${item.className}("${item.name}")`;
                                    }
                                    return item;
                                });
                            } else {
                                flattenedEditedProperties[key] = value;
                            }
                        });
                    }
                    return {
                        id: obj.id,
                        className: obj.className,
                        name: obj.name,
                        type: obj.type,
                        x: obj.x,
                        y: obj.y,
                        connections: connections,
                        editedProperties: flattenedEditedProperties,
                    };
                }
                return {
                    id: obj.id,
                    className: obj.className,
                    name: obj.name,
                    type: obj.type,
                    x: obj.x,
                    y: obj.y,
                    connections: connections,
                    editedProperties: obj.editedProperties
                };
            });

            fetch('/writeRdla2File', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(simplifiedObjects)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                    //alert('Render command sent successfully!');
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Error sending render command.');
                });
        });
    }
}
