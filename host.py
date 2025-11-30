#this is a host for the manual graph editor
#it continas functions for file IO for the graph editor
#start the http server on port 8011
#the http server will serve the files in the current directory

#there needs to be a function that will take the listOfObjects json data and writes out a rdla2 file
import os
import json
rld2ObjectStorage = None
def writeRdla2File(listOfObjects):
    global rld2ObjectStorage
    rld2ObjectStorage = listOfObjects
    with open('liverdlafile.rdl2', 'w') as f:
        json.dump(rld2ObjectStorage, f)

# starting with a specified directory, return a list of the files in JSON format  and send it to the webpage so that it can provide a file fileBrowser
def fileBrowser(startDirectory, filetype):
    files = []
    directories = [".", ".."]
    os.chdir(startDirectory)
    directory = os.getcwd()
    for file in os.listdir(directory):
        isDir = os.path.isdir(os.path.join(directory, file))
        if isDir:
            directories.append(os.path.join(directory, file))
        else:
            if file.endswith(filetype) or filetype == "all":
                files.append(os.path.join(directory, file))
    #json encode the files
    return json.dumps({"files": files, "directories": directories})

if __name__ == "__main__":
    print(fileBrowser(".", "all"))
    print(fileBrowser(".", ".rdl2"))

 