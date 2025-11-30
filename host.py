#this is a host for the manual graph editor
#it continas functions for file IO for the graph editor
#start the http server on port 8011
#the http server will serve the files in the current directory

import os
import json
import http.server
import socketserver

PORT = 8011
rld2ObjectStorage = None

#there needs to be a function that will take the listOfObjects json data and writes out a rdla2 file
def writeRdla2File(listOfObjects):
    global rld2ObjectStorage
    rld2ObjectStorage = listOfObjects
    with open('liverdlafile.rdl2', 'w') as f:
        json.dump(rld2ObjectStorage, f)

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
        for file in os.listdir(directory):
            isDir = os.path.isdir(os.path.join(directory, file))
            if isDir:
                directories.append(os.path.join(directory, file))
            else:
                if file.endswith(filetype) or filetype == "all":
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
        else:
            self.send_error(404)

if __name__ == "__main__":
    print(f"Starting server on port {PORT}...")
    with socketserver.TCPServer(("", PORT), MyRequestHandler) as httpd:
        print("Serving at port", PORT)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        httpd.server_close()
        print("Server stopped.")

 