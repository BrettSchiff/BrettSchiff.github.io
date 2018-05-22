/*-----------------------------------------------------------------------------
    JavaScript messing around page
    
Owner:     Brett Schiff
Contact:   brettschiff@gmail.com
Created:   5/6/2018
------------------------------------------------------------------------------*/

var canvas = document.getElementById("canvas0");
var context = canvas.getContext("2d");

var dt = 1000 / 60;

/********************************************************************************/
// Game Objects //

var gameObjects = [];

function createGameObject(shape, width, height, fillStyle) {

	createDrawComponent(shape, width, height, fillStyle, gameObjects.length);

	var newGameObject = { isActive: true };
	gameObjects.push(newGameObject);
}

/********************************************************************************/
// Transform //

var drawComponents = [];

function createDrawComponent(shape, width, height, fillStyle, parentIndex) {

	var newDrawComponent = { shape: shape, width: width, height: height, fillStyle: fillStyle, parentIndex: parentIndex };

	return newDrawComponent;

}

function drawDrawComponent(component) {

	//!?!? get the object's actual position
	var position = { x: 50, y: 50 };

	if (component.shape === "rect") {

		context.fillStyle = component.fillStyle;
		context.fillRect(position.x, position.y, component.width, component.height);

	}

}

function drawComponentUpdate() {

	for (var i = 0; i < drawComponents.length; i++) {
		drawDrawComponent(drawComponents[i]);
	}

}

/********************************************************************************/
// Graphics //

var drawComponents = [];

function createDrawComponent(shape, width, height, fillStyle) {

	var newDrawComponent = { shape: shape, width: width, height: height, fillStyle: fillStyle };

	drawComponents.push(newDrawComponent);
}

function drawDrawComponent(component) {

	//!?!? get the object's actual position
	var position = { x: 50, y: 50 };

	if (component.shape === "rect") {
		
		context.fillStyle = component.fillStyle;
		context.fillRect(position.x, position.y, component.width, component.height);

	}

}

function drawComponentUpdate() {

	for (var i = 0; i < drawComponents.length; i++) {
		drawDrawComponent(drawComponents[i]);
	}

}

/********************************************************************************/

window.onload = function () {
	start();
	setInterval(update, dt);
	setInterval(LIFE_update, LIFE_dt);

};

function start() {

	createGameObject("rect", 30, 30, "red");
	createGameObject("rect", 20, 20, "green");
	createGameObject("rect", 10, 10, "blue");

}

function update() {
	
	context.fillStyle = "black";
	context.fillRect(0, 0, canvas.width, canvas.height);

	drawComponentUpdate();

}
