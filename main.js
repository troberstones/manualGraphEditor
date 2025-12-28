function resizeCanvas() {
    canvas.width = mainContainer.clientWidth;
    canvas.height = mainContainer.clientHeight;
    refreshTheCanvas();
}

function setupDefaultProject() {
    listOfObjects = [];
    setOfNames = [];
    selectedObject = null;
    // create a rdl2 BaseMaterial object
    var baseMaterial = createRdlObject(rdl2Objects.scene_classes["BaseMaterial"], "Test Base Material");
    var blendMap = createRdlObject(rdl2Objects.scene_classes["BlendMap"], "Test BlendMap");
    createNodeConnection(baseMaterial, "diffuse_color", blendMap);
    createRdlObject(rdl2Objects.scene_classes["Layer"], "Test Layer");
    box = createRdlObject(rdl2Objects.scene_classes["BoxGeometry"], "Box");
    box.editedProperties["node_xform"] = xform(3, 0, 0);
    sphere = createRdlObject(rdl2Objects.scene_classes["SphereGeometry"], "Sphere");
    sphere.editedProperties["node_xform"] = xform(0, 2, 0)
    usdGeo = createRdlObject(rdl2Objects.scene_classes["UsdGeometry"], "usdGeometry");
    usdGeo.editedProperties["stage"] = "/Users/chrisharvey/Documents/manualGraphEditor/threeMonkeys.usdc";
    usdGeo.editedProperties["prim_path"] = "/root/Suzanne";
    sl = createRdlObject(rdl2Objects.scene_classes["SphereLight"], "SphereLight");
    sl.editedProperties["node_xform"] = xform(-3, 2, 0);
    sl = createRdlObject(rdl2Objects.scene_classes["SphereLight"], "SphereLight_2");
    sl.editedProperties["node_xform"] = xform(10, 10, 0);
    createRdlObject(rdl2Objects.scene_classes["DistantLight"], "DistantLight");
    camera = createRdlObject(rdl2Objects.scene_classes["PerspectiveCamera"], "Camera");
    camera.editedProperties["node_xform"] = makeMat4([0.555086, 0, -0.831793, 0, 0.0477246, 0.998353, 0.0318484, 0, 0.830356, -0.057371, 0.554126, 0, 10.7715, -1.49194, 7.58975, 1]);
    scenevars = createRdlObject(rdl2Objects.scene_classes["SceneVariables"], "SceneVariables");
    scenevars.editedProperties["image_width"] = 512;
    scenevars.editedProperties["image_height"] = 512;
}
window.addEventListener('resize', resizeCanvas);
// Initial resize
resizeCanvas();

// function to initialize the application
async function init() {
    listOfObjects = [];
    rdl2Objects = await readJsonFile("rdl2Objects.json");
    Object.keys(rdl2Objects.scene_classes).forEach(key => {
        rdl2Objects.scene_classes[key].class_name = key;
        if (rdl2Objects.scene_classes[key].attributes && rdl2Objects.scene_classes[key].attributes["node_xform"]) {
            rdl2Objects.scene_classes[key].attributes["node_xform"].bindable = true;
        }
    });

    rdl2Objects.scene_classes["TranslateNode"] = {
        class_name: "TranslateNode",
        type: "internalXform",
        attributes: {
            translate: {
                attrType: "Vec3f",
                bindable: true,
                default: [0, 0, 0],
                metadata: { label: "Translate" }
            }
        }
    };

    rdl2Objects.scene_classes["RotateNode"] = {
        class_name: "RotateNode",
        type: "internalXform",
        attributes: {
            axis: {
                attrType: "Vec3f",
                bindable: false,
                default: [0, 1, 0],
                metadata: { label: "Axis" }
            },
            angle: {
                attrType: "Float",
                bindable: true,
                default: 0,
                metadata: { label: "Angle" }
            }
        }
    };

    rdl2Objects.scene_classes["ScaleNode"] = {
        class_name: "ScaleNode",
        type: "internalXform",
        attributes: {
            uniformScale: {
                attrType: "Float",
                bindable: false,
                default: 1,
                metadata: { label: "Uniform Scale" }
            },
            scale: {
                attrType: "Vec3f",
                bindable: true,
                default: [1, 1, 1],
                metadata: { label: "Scale" }
            }
        }
    };
    // Attempt to load from local storage
    if (!loadLocalState()) {
        setupDefaultProject();
    }

    refreshTheCanvas();

    // Populate the list
    if (rdl2Objects) {
        populateLeftRDLObjectList();
    }

    setupMouseEvents();
    setupKeyboardEvents();
    setupContextMenu();
    setupSaveMenu();
    setupFileMenu();
    setupRenderMenu();
    setupLayerStack();
    setupTabs();

    // Setup New Project menu
    const newMenu = document.getElementById('menu-new');
    if (newMenu) {
        newMenu.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the project? This will reset all your changes to defaults.")) {
                clearLocalState();
                init();
            }
        });
    }

    // Save state on unload
    window.addEventListener('beforeunload', () => {
        saveLocalState();
    });
}

function setupLayerStack() {
    const addBaseBtn = document.getElementById('addBaseMaterialBtn');
    const fillLayerBtn = document.getElementById('fillLayerBtn');

    if (addBaseBtn) {
        addBaseBtn.addEventListener('click', (e) => {
            const rect = addBaseBtn.getBoundingClientRect();
            const x = rect.left;
            const y = rect.bottom;

            // Filter for DwaBaseLayerable
            const validTypes = [];
            if (rdl2Objects && rdl2Objects.scene_classes) {
                for (const key in rdl2Objects.scene_classes) {
                    if (rdl2Objects.scene_classes[key].type === "DwaBaseLayerable") {
                        validTypes.push(key);
                    }
                }
            }

            // Check if we found any, if not, maybe for testing show all Materials? 
            // User requested strict "DwaBaseLayerable".
            // If empty, I'll just show "No compatible types" or similar.

            showSimpleContextMenu(x, y, validTypes.length > 0 ? validTypes : ["No DwaBaseLayerable found"], (selected) => {
                if (selected === "No DwaBaseLayerable found") return;

                // Create the object
                createRdlObject(rdl2Objects.scene_classes[selected], selected);
                refreshTheCanvas();
            });
        });
    }

    if (fillLayerBtn) {
        fillLayerBtn.addEventListener('click', () => {
            console.log("Fill button clicked");
            // Future implementation
        });
    }
}

function showSimpleContextMenu(x, y, items, callback) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.display = 'block';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    items.forEach(itemText => {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = itemText;
        if (itemText === "No DwaBaseLayerable found") {
            item.className += " disabled";
        }
        item.addEventListener('click', () => {
            callback(itemText);
            document.body.removeChild(menu);
        });
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    setTimeout(() => {
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                if (document.body.contains(menu)) document.body.removeChild(menu);
                window.removeEventListener('click', closeMenu);
            }
        };
        window.addEventListener('click', closeMenu);
    }, 0);
}

function setupTabs() {
    const objectListTab = document.getElementById('objectListTab');
    const layersStackTab = document.getElementById('layersStackTab');
    const objectList = document.getElementById('objectList');
    const layersStack = document.getElementById('layersStack');

    function selectTab(tabName) {
        if (tabName === 'objectList') {
            objectListTab.classList.add('active');
            layersStackTab.classList.remove('active');
            objectList.classList.remove('hidden');
            layersStack.classList.add('hidden');
        } else {
            layersStackTab.classList.add('active');
            objectListTab.classList.remove('active');
            layersStack.classList.remove('hidden');
            objectList.classList.add('hidden');
        }
    }

    objectListTab.addEventListener('click', () => selectTab('objectList'));
    layersStackTab.addEventListener('click', () => selectTab('layersStack'));

    // Default to Object List
    selectTab('objectList');
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', init);
