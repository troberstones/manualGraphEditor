function resizeCanvas() {
    canvas.width = mainContainer.clientWidth;
    canvas.height = mainContainer.clientHeight;
    refreshTheCanvas();
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
    });
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

    refreshTheCanvas();

    // Populate the list
    if (rdl2Objects) {
        populateLeftRDLObjectList();
    }

    setupMouseEvents();
    setupContextMenu();
    setupSaveMenu();
    setupFileMenu();
    setupRenderMenu();
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', init);
