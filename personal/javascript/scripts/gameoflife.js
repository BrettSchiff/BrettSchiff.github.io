/*-----------------------------------------------------------------------------
    JavaScript Conway's Game of Life
    
Owner:     Brett Schiff
Contact:   brettschiff@gmail.com
Created:   5/20/2018

This is the very first actual thing I've made in JavaScript, I definitely know 
it's full of terrible practices, but I got it working 100% correctly, which
was the main goal for this first simple project.
------------------------------------------------------------------------------*/

/******************************************************************************/
/** Globals **/

// html Connection

var LIFE_canvas = document.getElementById("canvas0");
var LIFE_context = LIFE_canvas.getContext("2d");
LIFE_canvas.addEventListener("mousemove", LIFE_MouseInput, false);
LIFE_canvas.addEventListener("click", LIFE_MouseInput, false);

var LIFE_dt = 1000 / 15;

// project-specific

// things you specify
var LIFE_numRows = 30;
var LIFE_numCols = 60;

var LIFE_tilePercentage = .9;

var LIFE_placeColor = "black";
var LIFE_tileActiveColor = "white";
var LIFE_tileInactiveColor = "grey";

// things that are calculated automatically
var LIFE_placeWidth = Math.floor(LIFE_canvas.width / LIFE_numCols);
var LIFE_placeHeight = Math.floor(LIFE_canvas.height / LIFE_numRows);

var LIFE_tileWidth = Math.floor(LIFE_placeWidth * LIFE_tilePercentage);
var LIFE_tileHeight = Math.floor(LIFE_placeHeight * LIFE_tilePercentage);

LIFE_canvas.width = LIFE_placeWidth * LIFE_numCols;
LIFE_canvas.height = LIFE_placeHeight * LIFE_numRows;

var LIFE_mousePos = { x: 0, y: 0 };

var LIFE_paused = false;

var LIFE_inputAdd = true;
var LIFE_inputChange = true;

var LIFE_mainLoop = null;

/******************************************************************************/
/** Tiles **/ 

var LIFE_tiles = [];

function LIFE_drawTileAtIndex(index) {

	var offsetX = Math.floor((LIFE_placeWidth - LIFE_tileWidth) / 2);
	var offsetY = Math.floor((LIFE_placeHeight - LIFE_tileHeight) / 2);

	if (LIFE_tiles[index].isActive === true) {

		LIFE_context.fillStyle = LIFE_tileActiveColor;
	}
	else {

		LIFE_context.fillStyle = LIFE_tileInactiveColor;
	}

	var x = index % LIFE_numCols;
	var y = Math.floor(index / LIFE_numCols);

	LIFE_context.fillRect(x * LIFE_placeWidth + offsetX, y * LIFE_placeHeight + offsetY, LIFE_tileWidth, LIFE_tileHeight);
}

function LIFE_drawTiles() {

	var offsetX = Math.floor((LIFE_placeWidth - LIFE_tileWidth) / 2);
	var offsetY = Math.floor((LIFE_placeHeight - LIFE_tileHeight) / 2);

	for (var i = 0; i < LIFE_numCols; i++) {

		for (var j = 0; j < LIFE_numRows; j++) {

			var index = j * LIFE_numCols + i;

			if (LIFE_tiles[index].isActive === true) {

				LIFE_context.fillStyle = LIFE_tileActiveColor;
			}
			else {

				LIFE_context.fillStyle = LIFE_tileInactiveColor;
			}

			LIFE_context.fillRect( i * LIFE_placeWidth + offsetX, j * LIFE_placeHeight + offsetY, LIFE_tileWidth, LIFE_tileHeight);
		}
	}
}

function LIFE_getIndexFromCoordinates(x, y) {

	return y * LIFE_numCols + x;
}

/******************************************************************************/
/** Game of Life Logic **/

function LIFE_getTileAbove(index) {

	if (index < LIFE_numCols) { return null; }
	else { return LIFE_tiles[index - LIFE_numCols]; }
}

function LIFE_getTileBelow(index) {

	if (index >= LIFE_numCols * (LIFE_numRows - 1)) { return null; }
	else { return LIFE_tiles[index + LIFE_numCols]; }
}

function LIFE_getTileLeft(index) {

	if (index % LIFE_numCols === 0) { return null; }
	else { return LIFE_tiles[index - 1]; }
}

function LIFE_getTileRight(index) {

	if (index % LIFE_numCols === LIFE_numCols - 1) { return null; }
	else { return LIFE_tiles[index + 1]; }
}

function LIFE_getMousedTile(pageX, pageY) {

	var rect = LIFE_canvas.getBoundingClientRect();

	var mousePixel = {
		x: pageX - rect.left,
		y: pageY - rect.top
	};

	if (mousePixel.x < 0 || mousePixel.y < 0 || mousePixel.x >= LIFE_canvas.width || mousePixel.y >= LIFE_canvas.height) {

		LIFE_mouseDown = false;
		return null;
	}

	return {
		x: Math.floor(mousePixel.x / LIFE_placeWidth),
		y: Math.floor(mousePixel.y / LIFE_placeHeight)
	};
}

function LIFE_numActiveNeighbors(index) {

	var total = 0;

	// simple above and below checks
	if (LIFE_getTileAbove(index) && LIFE_getTileAbove(index).isActive) { total++; }
	if (LIFE_getTileBelow(index) && LIFE_getTileBelow(index).isActive) { total++; }

	// left and right will also check the diagonal neightbors
	if (LIFE_getTileLeft(index)) {

		if (LIFE_getTileLeft(index).isActive) { total++; }

		var leftIndex = index - 1;

		if (LIFE_getTileAbove(leftIndex) && LIFE_getTileAbove(leftIndex).isActive) { total++; }
		if (LIFE_getTileBelow(leftIndex) && LIFE_getTileBelow(leftIndex).isActive) { total++; }
	}
	if (LIFE_getTileRight(index)) {

		if (LIFE_getTileRight(index).isActive) { total++; }

		var rightIndex = index + 1;

		if (LIFE_getTileAbove(rightIndex) && LIFE_getTileAbove(rightIndex).isActive) { total++; }
		if (LIFE_getTileBelow(rightIndex) && LIFE_getTileBelow(rightIndex).isActive) { total++; }
	}

	return total;
}

function LIFE_gameOfLifeLogicUpdate() {

	for (var i = 0; i < LIFE_numCols; i++) {

		for (var j = 0; j < LIFE_numRows; j++) {

			index = j * LIFE_numCols + i;
			var neighbors = LIFE_numActiveNeighbors(index);

			if (LIFE_tiles[index].isActive === true) {

				if (neighbors < 2 || neighbors > 3) {

					LIFE_tiles[index].setActive = false;
				}
			}
			else {

				if (neighbors === 3) {

					LIFE_tiles[index].setActive = true;
				}
			}
		}
	}

	for (i = 0; i < LIFE_numCols; i++) {

		for (j = 0; j < LIFE_numRows; j++) {

			var index = j * LIFE_numCols + i;

			LIFE_tiles[index].isActive = LIFE_tiles[index].setActive;

		}
	}
}

var LIFE_mouseDown = false;

LIFE_canvas.onmousedown = function () {
	LIFE_mouseDown = true;
};

LIFE_canvas.onmouseup = function () {
	LIFE_mouseDown = false;
	LIFE_inputChange = true;
};

function LIFE_togglePause() {

	LIFE_paused = !LIFE_paused;
}

function LIFE_advanceOneFrame() {

	var pauseState = LIFE_paused;
	LIFE_paused = false;
	LIFE_update();
	LIFE_paused = pauseState;
}

function LIFE_changeSpeed(newSpeed) {

	clearInterval(LIFE_mainLoop);
	LIFE_mainLoop = setInterval(LIFE_update, 1000 / newSpeed);
}

/******************************************************************************/

function LIFE_start() {

	for (var i = 0; i < LIFE_numCols; i++) {

		for (var j = 0; j < LIFE_numRows; j++) {

			LIFE_tiles.push({isActive: false, setActive: false});
		}
	}

	LIFE_update();
	LIFE_paused = true;
}

function LIFE_update() {
	
	if (LIFE_paused === false) {

		LIFE_context.fillStyle = LIFE_placeColor;
		LIFE_context.fillRect(0, 0, LIFE_canvas.width, LIFE_canvas.height);

		LIFE_gameOfLifeLogicUpdate();

		LIFE_drawTiles();
	}
}

function LIFE_MouseInput(event) {

	LIFE_mousePos = { x: event.clientX, y: event.clientY };
}

function LIFE_inputUpdate()
{
	if (LIFE_mouseDown === true) {

		var mouseTilePos = LIFE_getMousedTile(LIFE_mousePos.x, LIFE_mousePos.y);

		if (mouseTilePos === null) {
			return;
		}

		var index = LIFE_getIndexFromCoordinates(mouseTilePos.x, mouseTilePos.y);

		if (LIFE_inputChange === true) {

			LIFE_inputChange = false;

			if(LIFE_tiles[index].isActive === false) {

				LIFE_inputAdd = true;
			}
			else {

				LIFE_inputAdd = false;
			}
		}

		if (LIFE_inputAdd === true) {

			LIFE_tiles[index].isActive = true;
			LIFE_tiles[index].setActive = true;
		}
		else {

			LIFE_tiles[index].isActive = false;
			LIFE_tiles[index].setActive = false;
		}

		

		LIFE_drawTileAtIndex(index);
	}
}

function LIFE_mainOnLoad() {

	LIFE_start();
	LIFE_mainLoop = setInterval(LIFE_update, LIFE_dt);
	setInterval(LIFE_inputUpdate, 1000 / 60);
}
