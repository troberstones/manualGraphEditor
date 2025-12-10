#this is a host for the manual graph editor
#it continas functions for file IO for the graph editor
#start the http server on port 8011
#the http server will serve the files in the current directory

import os
import json
import http.server
import socketserver
from pxr import Usd, UsdGeom
import fnmatch
import sys
from zlib import adler32
import copy

PORT = 8011
rld2ObjectStorage = None
rdl2_schema = None

def getUsdGeometryPrims(usdFilePath):
    stage = Usd.Stage.Open(usdFilePath)
    geometryPrims = [x.GetPath() for x in stage.Traverse() if x.IsA(UsdGeom.Gprim)]
    return geometryPrims

def getPrimsFromUSD(usdStage, primPath):
    prims = getUsdGeometryPrims(usdStage)
    prims = [prim.pathString for prim in prims]
    print(prims)
    #use the wildcard expression in the primPath to match primt is the prims list, 
    #return the matching primsj
    return [prim for prim in prims if fnmatch.fnmatch(prim, primPath)]

def saveSceneAsJson(filePath, sceneJson):
    processedScene = json.loads(sceneJson)
    with open(filePath, 'w') as f:
        # pretty print the json
        json.dump(processedScene, f, indent=2)

def loadSceneAsJson(filePath):
    with open(filePath, 'r') as f:
        return json.load(f)
        
def loadSceneFromJson(filePath):
    with open(filePath, 'r') as f:
        return json.load(f)

def loadRdl2Schema():
    global rdl2_schema
    if rdl2_schema is None:
        try:
            with open('rdl2Objects.json', 'r') as f:
                rdl2_schema = json.load(f)
        except Exception as e:
            print(f"Error loading rdl2Objects.json: {e}")
            rdl2_schema = {}

def formatValue(value, attrType):
    if attrType == 'String':
        return f'"{value}"'
    elif attrType == 'Bool':
        return 'true' if value else 'false'
    elif attrType in ['Int', 'Float']:
        return str(value)
    elif attrType == 'Rgb':
        return f'Rgb({value[0]}, {value[1]}, {value[2]})'
    elif attrType == 'Rgba':
        return f'Rgba({value[0]}, {value[1]}, {value[2]}, {value[3]})'
    elif attrType == 'Vec2f':
        return f'Vec2({value[0]}, {value[1]})'
    elif attrType == 'Vec3f':
        return f'Vec3({value[0]}, {value[1]}, {value[2]})'
    elif attrType == 'Mat4d':
        # Flatten if it's 4x4 list of lists
        if isinstance(value[0], list):
            vals = [str(v) for row in value for v in row]
        else:
            vals = [str(v) for v in value]
        return f'Mat4({", ".join(vals)})'
    elif attrType == 'Enum':
        return str(value)
    else:
        return str(value)

#there needs to be a function that will take the listOfObjects json data and writes out a rdla2 file
def topologicalSort(objects):
    name_to_obj = {obj['name']: obj for obj in objects}
    adj = {obj['name']: set() for obj in objects}
    in_degree = {obj['name']: 0 for obj in objects}
    
    for obj in objects:
        objName = obj['name']
        connections = obj.get('connections', {})
        for attr, conn in connections.items():
            sourceName = conn['sourceNodeName']
            if sourceName in name_to_obj:
                if objName not in adj[sourceName]:
                    adj[sourceName].add(objName)
                    in_degree[objName] += 1
    
    queue = [name for name in in_degree if in_degree[name] == 0]
    queue.sort() # Deterministic order
    
    sorted_names = []
    
    while queue:
        u = queue.pop(0)
        sorted_names.append(u)
        
        neighbors = sorted(list(adj[u]))
        for v in neighbors:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)
                
    if len(sorted_names) < len(objects):
        remaining = sorted(list(set(name_to_obj.keys()) - set(sorted_names)))
        sorted_names.extend(remaining)
        
    return [name_to_obj[name] for name in sorted_names]

def writeRdla2File(listOfObjects):
    global rld2ObjectStorage
    rld2ObjectStorage = listOfObjects
    
    listOfObjects = topologicalSort(listOfObjects)
    
    loadRdl2Schema()
    scene_classes = rdl2_schema.get('scene_classes', {})
    
    # Build name to type map
    name_to_className = {obj['name']: obj['className'] for obj in listOfObjects}
    name_to_type = {obj['name']: obj['type'] for obj in listOfObjects}
    
    output_lines = []

    lightNodeList = [obj for obj in listOfObjects if obj['type'] == 'Light']

    output_lines_geometrySet = []
    output_lines_lightSet = []
    output_lines_layers = []

    # look for className UsdGeometry
    usdGeometryNodeList = [obj for obj in listOfObjects if obj['className'] == 'UsdGeometry']
    expandedGeometryNodeDict = {}
    for obj in usdGeometryNodeList:
        primPath = obj['editedProperties']['prim_path']
        usdStage = obj['editedProperties']['stage']
        if primPath and usdStage:
            if '*' in primPath:
                # use the usd module to get the tree of prims in the USD file
                # then remove this obj from the from the listOfObjects
                listOfObjects.remove(obj)
                #and duplicate it for each selected prim in based on the primPath expression
                #i.e. if the prim path says /root/suz* then fine all of the prims in the usd that math
                #that expression and duplicate the object for each one
                #the layer node needs to be updated so that the original instance for the the UsdGeometry("name") is replaced with 
                # thew new instances, wich each instance getting an deduplicaed name
                #
                # get the list of prims from the USD file
                prims = getPrimsFromUSD(usdStage, primPath)
                for prim in prims:
                    newObj = copy.deepcopy(obj)
                    hashIndex = adler32(prim.encode('utf-8'))
                    newObj['name'] = newObj['name'] + '_' + str(hashIndex)
                    newObj['editedProperties']['prim_path'] = prim
                    objFullName = f'{obj["className"]}("{obj["name"]}")'
                    if(expandedGeometryNodeDict.get(objFullName)):
                        expandedGeometryNodeDict[objFullName].append(newObj)
                    else:
                        expandedGeometryNodeDict[objFullName] = [newObj]
                    listOfObjects.append(newObj)

    geometryNodeList = [obj for obj in listOfObjects if obj['type'] == 'Geometry']
    output_lines_geometrySet.append('GeometrySet("GeometrySet") {')
    for obj in geometryNodeList:
        output_lines_geometrySet.append(f'    {obj["className"]}("{obj["name"]}"),')
    output_lines_geometrySet.append('}\n')

    output_lines_lightSet.append('local lightsetvar = LightSet("LightSet") {')
    for obj in lightNodeList:
        output_lines_lightSet.append(f'    {obj["className"]}("{obj["name"]}"),')
    output_lines_lightSet.append('}\n')
    for obj in listOfObjects:
        objType = obj['className']
        objName = obj['name']
        connections = obj.get('connections', {})
        editedProperties = obj.get('editedProperties', {})
        
        classSchema = scene_classes.get(objType, {})
        attributesSchema = classSchema.get('attributes', {})
        
        if objType == 'SceneVariables':
            line = f'SceneVariables {{'
        else:
            line = f'{objType}("{objName}") {{'
        
        # this is not great, I need to find a better way to handle this, 
        # maybe a function that takes an object and outputLines object to write to, 
        # then i can be specific about the order of the generation
        if objType != 'Layer':
            output_lines.append(line)
        
        # Collect all attributes to write
        all_keys = set(editedProperties.keys()) | set(connections.keys())
        
        
        if objType == 'Layer':
            output_lines_layers.append(line)
            geometries = editedProperties.get('geometries', [])
            surface_shaders = editedProperties.get('surface_shaders', [])
            parts = editedProperties.get('parts', [])
            light_sets = editedProperties.get('lightSet', [])
            
            if not isinstance(geometries, list): geometries = []
            if not isinstance(surface_shaders, list): surface_shaders = []
            if not isinstance(parts, list): parts = []
            if not isinstance(light_sets, list): light_sets = []
            
            max_len = len(geometries)
            for i in range(max_len):
                geo = geometries[i]
                mat = surface_shaders[i] if i < len(surface_shaders) else '""'
                part = parts[i] if i < len(parts) else '""'
                light_set = light_sets[i] if i < len(light_sets) else 'lightsetvar'
                # if the geo was expaded based on the primPath expression
                # then we need to duplicate the layer entry for each expanded geometry
                if(geo in expandedGeometryNodeDict):
                    for expandedGeo in expandedGeometryNodeDict[geo]:
                        geo = f'{expandedGeo["className"]}("{expandedGeo["name"]}")'
                        output_lines_layers.append(f'    {{{geo}, {part}, {mat}, {light_set}}},')
                else:
                    output_lines_layers.append(f'    {{{geo}, {part}, {mat}, {light_set}}},')
            output_lines_layers.append('}\n')
            
            all_keys.discard('geometries')
            all_keys.discard('surface_shaders')
            all_keys.discard('parts')
            all_keys.discard('lightSet')
        
        for attrName in all_keys:
            attrSchema = attributesSchema.get(attrName, {})
            attrType = attrSchema.get('attrType', 'String')
            isBindable = attrSchema.get('bindable', False)
            
            valString = ""
            
            if attrName in connections:
                sourceNodeName = connections[attrName]['sourceNodeName']
                className = name_to_className.get(sourceNodeName)
                
                if className:
                    sourceRef = f'{className}("{sourceNodeName}")'
                else:
                    sourceRef = f'"{sourceNodeName}"'
                
                if isBindable:
                    # It's a binding: bind(Map, BaseValue)
                    if attrName in editedProperties:
                        baseVal = editedProperties[attrName]
                    else:
                        baseVal = attrSchema.get('default')
                        if baseVal is None:
                             if attrType == 'Rgb': baseVal = [0,0,0]
                             elif attrType == 'Float': baseVal = 0.0
                    
                    baseValStr = formatValue(baseVal, attrType)
                    valString = f'bind({sourceRef}, {baseValStr})'
                else:
                    valString = sourceRef
            else:
                val = editedProperties[attrName]
                valString = formatValue(val, attrType)
            
            output_lines.append(f'    ["{attrName}"] = {valString},')
            
        # this is a stupid wat to do it. 
        if objType != 'Layer':
            output_lines.append('}')
        output_lines.append('')
        
    with open('liverdlafile.rdla', 'w') as f:
        f.write('\n'.join(output_lines))
        f.write('\n'.join(output_lines_geometrySet))
        f.write('\n'.join(output_lines_lightSet))
        f.write('\n'.join(output_lines_layers))

# starting with a specified directory, return a list of the files in JSON format  and send it to the webpage so that it can provide a file fileBrowser
def fileBrowser(startDirectory, filetype):
    original_cwd = os.getcwd()
    files = []
    directories = [".", ".."]
    try:
        try:
            os.chdir(startDirectory)
        except FileNotFoundError:
            pass # Stay in current dir if target not found
            
        directory = os.getcwd()
        directories = [os.path.join(directory, "."), os.path.join(directory, "..")]
        
        # Normalize filetype to a list of lowercase extensions
        if isinstance(filetype, str):
            if filetype == "all":
                extensions = None
            else:
                extensions = [filetype.lower()]
        elif isinstance(filetype, list):
            extensions = [ext.lower() for ext in filetype]
        else:
            extensions = None

        for file in os.listdir(directory):
            isDir = os.path.isdir(os.path.join(directory, file))
            if isDir:
                directories.append(os.path.join(directory, file))
            else:
                if extensions is None:
                    files.append(os.path.join(directory, file))
                else:
                    file_lower = file.lower()
                    if any(file_lower.endswith(ext) for ext in extensions):
                        files.append(os.path.join(directory, file))
        #json encode the files
        return json.dumps({"files": files, "directories": directories, "currentDirectory": directory})
    finally:
        os.chdir(original_cwd)

def saveObjectList(data):
    with open('project_objects.json', 'w') as f:
        json.dump(data, f)

def getObjectList():
    if os.path.exists('project_objects.json'):
        with open('project_objects.json', 'r') as f:
            return f.read()
    return '[]'

class MyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/getObjectList':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(getObjectList().encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/fileBrowser':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data)
                response = fileBrowser(data.get('startDirectory', '.'), data.get('filetype', 'all'))
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(response.encode('utf-8'))
            except Exception as e:
                self.send_error(500, str(e))

        elif self.path == '/writeRdla2File':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data)
                writeRdla2File(data)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_error(500, str(e))

        elif self.path == '/saveObjectList':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data)
                saveObjectList(data)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_error(500, str(e))

        elif self.path == '/saveSceneAsJson':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data)
                saveSceneAsJson(data['filePath'], data['sceneJson'])
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_error(500, str(e))
        elif self.path == '/loadSceneFromJson':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data)
                scene_data = loadSceneFromJson(data['filePath'])
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(scene_data).encode('utf-8'))
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)

if __name__ == "__main__":
    if(len(sys.argv) > 1):
        usdStage = sys.argv[1]
        primPath = sys.argv[2]
        foo = getPrimsFromUSD(usdStage, primPath)
        print("matches!")
        print(foo)
    else:
        print(f"Starting server on port {PORT}...")
        with socketserver.TCPServer(("", PORT), MyRequestHandler) as httpd:
            print("Serving at port", PORT)
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                pass
            httpd.server_close()
            print("Server stopped.")

 