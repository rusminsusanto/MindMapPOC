var diagram;
var nodes = [];
var links = [];
var rootNodeKey = 'b78ced69-f0de-40b3-bb2b-13d9e5f2323c';
var LastUsedLayout, CentralIdeaKey;

function init() {
	var $ = go.GraphObject.make;
	
	diagram =  $(go.Diagram, "myDiagram",
				 {
					initialContentAlignment: go.Spot.Center,
					"commandHandler.deletesTree": true,
					"draggingTool.dragsTree": true
//					layout: $(go.TreeLayout, // specify a Diagram.layout that arranges trees
//						   { angle: 90, layerSpacing: 35 })
				 });


    // enable Ctrl-Z to undo and Ctrl-Y to redo
    diagram.undoManager.isEnabled = false;
	//jQuery.getJSON("http://localhost:8000/data/model.json", load);
	parseXML('http://localhost:8000/data/MindMap.xml');

	diagram.nodeTemplate =
	$(go.Node, "Auto",
 	  {
		resizable:true,
		locationSpot: go.Spot.Center,
		resizeObjectName:"SHAPE"
	  },
	  $(go.Shape,
		{
			name: "SHAPE",
			portId: "", fromSpot: go.Spot.LeftRightSides, toSpot: go.Spot.LeftRightSides
		},
		new go.Binding("figure", "Category"),
		new go.Binding("desiredSize", "Size", go.Size.parse),
		new go.Binding("fromSpot", "dir", function(d) { return spotConverter(d, true); }),
		new go.Binding("toSpot", "dir", function(d) { return spotConverter(d, false); }),
		new go.Binding("locationSpot", "dir", function(d) { return spotConverter(d, false); } ),
		new go.Binding("fill", "FillColor"),
		new go.Binding("stroke", "BorderColor"),
		new go.Binding("strokeWidth", "BorderWeight"),
		new go.Binding("location", "Position", go.Point.parse).makeTwoWay(go.Point.stringify)),  // binding to get fill from nodedata.color

	  $(go.TextBlock,
		{ margin: 5 },
		{ font: "9px sans-serif", textAlign: "center", editable:true, isMultiline:true, wrap: go.TextBlock.WrapFit},
		new go.Binding("width", "TextWidth"),
		new go.Binding("text", "Text"))  // binding to get TextBlock.text from nodedata.key
	  );

	// Add double click handler
	diagram.addDiagramListener("ObjectDoubleClicked", function(e) {
		var part = e.subject.part;
		if (!(part instanceof go.Link)) {
			alert('Should call objC to open : ' + part.data.Text + '\nguid is : ' + part.data.key);
		}
	});

	// Add Context Menu handler
	diagram.addDiagramListener("ObjectContextClicked", function(e) {
		var part = e.subject.part;
		if (!(part instanceof go.Link)) {
		   alert('Context menu on : ' + part.data.Text + '\nguid is : ' + part.data.key);
		}
	});

	diagram.linkTemplate =
	$(go.Link,
	  {
	  curve: go.Link.Bezier,
	  fromShortLength: -2,
	  toShortLength: -2,
	  selectable: false
	  },
	  $(go.Shape,
		{ strokeWidth: 1 }
		)
	  );

	var slider = document.getElementById('zoom');
	slider.value = 1.0;
}

function load(jsondata) {
	// create the model from the data in the JavaScript object parsed from JSON text
	nodes = jsondata["nodes"];
	links = jsondata["links"];

	diagram.model = new go.TreeModel(nodes);
}

function toJSON() {
	var model = diagram.model.toJson();
	console.log(model);
}

function findNodeInfo() {
	var node = diagram.selection.first();
	if (node && !(node instanceof go.Link)) {
		alert('Name : ' + node.data.Text + '\nGuid : ' + node.data.key + '\nPosition : ' + node.data.position);
	}
}

function upDownTree() {
	layoutTree();
	LastUsedLayout='Tree';
}

function leftRightTree() {
	layoutAll();
	LastUsedLayout='LeftRight';
}

function zoomChange() {
	var slider = document.getElementById('zoom');
	if (slider) {
		diagram.scale = parseFloat(slider.value);
	}
}

function generateGUID(){
	var d = new Date().getTime();
	if(window.performance && typeof window.performance.now === "function"){
		d += performance.now();; //use high-precision timer if available
	}
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
															  var r = (d + Math.random()*16)%16 | 0;
															  d = Math.floor(d/16);
															  return (c=='x' ? r : (r&0x3|0x8)).toString(16);
															  });
	return uuid;
}

function addChild() {
	var parent = diagram.selection.first().data;
	if (parent && (parent.Category === "Ellipse" || parent.parent)) {
		var adorn = parent.part;
		diagram.startTransaction("Add Node");

		// copy the brush and direction to the new node data
		var newdata = { 'Text': 'idea', 'key': generateGUID(), 'Category': 'RoundedRectangle', 'parent' : parent.key, 'FillColor':parent.FillColor,
		'BorderColor':parent.BorderColor, 'Size':parent.Size, 'TextWidth':parent.TextWidth, 'BorderWeight':0};
		diagram.model.addNodeData(newdata);
		if (LastUsedLayout='LeftRight') {
			layoutParent(parent);
		}
		diagram.commitTransaction("Add Node");
	}
}

// Note: Windows store the color as Alpha,Red,Green,Blue
// So  #FFA5FF90 -> A:FF, R:A5, G:FF, B:90
function convertHex(hex) {
	if (hex) {
		hex = hex.replace('#','');
		r = parseInt(hex.substring(2,4), 16);
		g = parseInt(hex.substring(4,6), 16);
		b = parseInt(hex.substring(6,8), 16);
		a = parseInt(hex.substring(0,2), 16) / 255;
		result = 'rgba(' + r + ',' + g +',' + b + ',' + a + ')';
		return result;
	}

	return null;
}

function parseXML(xmlPath) {
	var nodesKeyValue = {};
	$.get(xmlPath, function(xml) {
		  var $modelInfo = $(xml).find('Model');

		  LastUsedLayout = $modelInfo.attr('LastUsedLayout');
		  CentralIdeaKey = $modelInfo.attr('CentralIdeaKey');

		 $(xml).find('ShapeElement').each(function() {
			var $node = $(this);
			var Key = $node.find("Key").text();
			var Category = $node.find("Category").text();
			var Text = $node.find("Text").text();
			var Location = $node.find("Location").text();
			var Width = parseInt($node.find("Width").text());
			var Height = parseInt($node.find("Height").text());
			var FillColor = $node.find("FillColor").text();
			var BorderWeight = parseInt($node.find("BorderWeight").text());
			var BorderColor = $node.find("BorderColor").text();

			if (!FillColor) {
				FillColor='#ffdbff8a';
			}
			// Convert color in #FFA5FF90 to rgba... format
			var fillColorInRGBA = FillColor ? convertHex(FillColor) : 'rgba(255,255,255,0.5';
			var borderColorInRGBA = BorderColor ? convertHex(BorderColor) : 'rgba(0, 0, 0, 1)';

			if (!Width) {
				Width = 100;
			}
			if (!Height) {
				Height = 50;
			}
			var node = {'Text' : Text, 'key' : Key, 'Category' : Category, 'Position' : Location, 'Category' : Category,
										  'FillColor' : fillColorInRGBA, 'BorderColor' : borderColorInRGBA, 'BorderWeight': BorderWeight,
										  'Size' : Width + ' ' + Height, 'TextWidth' : Width * 0.8};
			nodes.push(node);
			nodesKeyValue[Key] = node;
		});

		  $(xml).find('Link').each(function() {
			 var $node = $(this);
			 var FromItemKey = $node.find("FromItemKey").text();
			 var ToItemKey = $node.find("ToItemKey").text();

			 var node = nodesKeyValue[ToItemKey];
 			 if (node) {
				node.parent = FromItemKey;
			}
		});

		diagram.model = new go.TreeModel(nodes);
		//layoutAll();
		  layoutTree();
	});
}

function spotConverter(dir, from) {
	if (dir === "left") {
		return (from ? go.Spot.Left : go.Spot.Right);
	} else {
		return (from ? go.Spot.Right : go.Spot.Left);
	}
}

function layoutTree() {
	diagram.layout = go.GraphObject.make(go.TreeLayout,
									 { angle: 90,
          arrangement: go.TreeLayout.ArrangementFixedRoots,
          layerSpacing: 30 });
}

function layoutAngle(parts, angle) {
	var layout = go.GraphObject.make(go.TreeLayout,
									 { angle: angle,
          arrangement: go.TreeLayout.ArrangementFixedRoots,
          nodeSpacing: 5,
          layerSpacing: 30 });
	layout.doLayout(parts);
}

function layoutParent(node) {
	if (node.key === rootNodeKey) {  // adding to the root?
		layoutAll();  // lay out everything
	} else {  // otherwise lay out only the subtree starting at this parent node
		var root = diagram.findNodeForKey(node.key);
		var parts = root.findTreeParts();
		layoutAngle(parts, root.data.dir === "left" ? 180 : 0);
	}
}
function layoutAll() {
	var root = diagram.findNodeForKey(rootNodeKey);
	if (root === null) return;
	diagram.startTransaction("Layout");
	// split the nodes and links into two collections
	var rightward = new go.Set(go.Part);
	var leftward = new go.Set(go.Part);
	var left = false;
	root.findLinksConnected().each(function(link) {
	   var child = link.toNode;
	   if (left) {
		leftward.add(root);  // the root node is in both collections
		leftward.add(link);
		leftward.addAll(child.findTreeParts());
	   }
		else {
		rightward.add(root);  // the root node is in both collections
		rightward.add(link);
		rightward.addAll(child.findTreeParts());
	   }
		left = !left;
	   });
	// do one layout and then the other without moving the shared root node
	layoutAngle(rightward, 0);
	layoutAngle(leftward, 180);
	diagram.commitTransaction("Layout");
}

function exportProjectMap() {
	var imgBlob = diagram.makeImage({
									scale: 1,
									type: "image/bmp"
									});
	var data = atob(imgBlob.src),
		asArray = new Uint8Array(imgBlob.src.length);

	for( var i = 0, len = imgBlob.src.length; i < len; ++i ) {
		asArray[i] = imgBlob.src.charCodeAt(i);
	}

	var blob = new Blob( [ asArray.buffer ], {type: "image/png"} );
}