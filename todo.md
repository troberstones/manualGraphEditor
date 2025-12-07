add translater and rotate nodes, these are handled through the export process but don't exist as rld nodes. just tacked on to the node_xform attribute of the asset

add the ability to expand usd files into a full represenstion rathen than a single node per part. This will be handled throuhg adding a * or some kind of expression to select the parts of the usd file. then at rld export time the different parts can be expanded. If a part is expanded in a usd file then all parts will receive a duplicate of the layaer entry of the original node. 

Question: should the whole thing take on mor flow based apprach? I.e. Scene vars plug into lights wiht a camera etc, or should I keep it more freeform? How does the pathing of the names impact the export like in the example files? is that just because thats the way that houdindi constructs the rld file?

TODO: add layer setup like in substance so that the materials can be constructed in a manner that makes proceduralizm easier to string together, rather than having to do it all in the graph editor. 

Order:
- [ ] usd expansion - in wholey in python.
- [ ] transforms- translate, rotate, scale
- [ ] layer setup
