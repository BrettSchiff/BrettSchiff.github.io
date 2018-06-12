/*-----------------------------------------------------------------------------
    Musical Dots
    
Owner:     Brett Schiff
Contact:   brettschiff@gmail.com
Created:   5/20/2018

I'm doing a quick attempt to remake CollegeHumor's Musical Dots program which
was pretty cool and an easy way to make nice-sounding sounds quickly.
reference: https://www.youtube.com/watch?v=7kr0xr6w8G4
------------------------------------------------------------------------------*/

/******************************************************************************/
/** Globals **/

// html Connection

var DOTS_canvas = document.getElementById("canvas1");
var DOTS_context = DOTS_canvas.getContext("2d");
DOTS_canvas.addEventListener("mousemove", DOTS_MouseInput, false);
DOTS_canvas.addEventListener("click", DOTS_MouseInput, false);

var DOTS_dt = 1000 / 8;

// project-specific

// things you specify
var DOTS_numRows = 15;
var DOTS_numCols = 60;

var DOTS_maxCols = 60;
var DOTS_minCols = 1;

var DOTS_tilePercentage = .9;

var DOTS_placeColor = "black";
var DOTS_tileActiveColor = "white";
var DOTS_tileInactiveColor = "grey";
var DOTS_tileInactiveCurrentCollor = "lightgrey";

// recorded with this: https://online-voice-recorder.com
var DOTS_testSoundFolder = "kalimba_badmic";

// things that are calculated automatically
var DOTS_originalCanvasWidth = DOTS_canvas.width;
var DOTS_originalCanvasHeight = DOTS_canvas.height;

var DOTS_placeWidth = Math.floor(DOTS_canvas.width / DOTS_numCols);
var DOTS_placeHeight = Math.floor(DOTS_canvas.height / DOTS_numRows);

var DOTS_tileWidth = Math.floor(DOTS_placeWidth * DOTS_tilePercentage);
var DOTS_tileHeight = Math.floor(DOTS_placeHeight * DOTS_tilePercentage);

DOTS_canvas.width = DOTS_placeWidth * DOTS_numCols;
DOTS_canvas.height = DOTS_placeHeight * DOTS_numRows;

var DOTS_mousePos = { x: 0, y: 0 };

var DOTS_paused = false;

var DOTS_inputAdd = true;
var DOTS_inputChange = true;

var DOTS_mainLoop = null;

var DOTS_volume = .5;

/******************************************************************************/
/** Tiles **/ 

var DOTS_sounds = [];

for (var i = 0; i < DOTS_numRows; ++i)
{
	DOTS_sounds.push("./sounds/" + DOTS_testSoundFolder + "/" + i + ".mp3");
}

var DOTS_tiles = [];

function DOTS_drawTileAtIndex(index) {

	var offsetX = Math.floor((DOTS_placeWidth - DOTS_tileWidth) / 2);
	var offsetY = Math.floor((DOTS_placeHeight - DOTS_tileHeight) / 2);

	if (DOTS_tiles[index].isActive === true) {

		DOTS_context.fillStyle = DOTS_tileActiveColor;
	}
	else if (DOTS_tiles[index].isPlaying === true) {

		DOTS_context.fillStyle = DOTS_tileInactiveCurrentCollor;
	}
	else {

		DOTS_context.fillStyle = DOTS_tileInactiveColor;
	}

	var y = index % DOTS_numRows;
	var x = Math.floor(index / DOTS_numRows);

	DOTS_context.fillRect(x * DOTS_placeWidth + offsetX, y * DOTS_placeHeight + offsetY, DOTS_tileWidth, DOTS_tileHeight);
}

function DOTS_IndexFromCoords(x, y)
{
	return x * DOTS_numRows + y;
}

function DOTS_drawTiles() {

	DOTS_context.fillStyle = DOTS_placeColor;
	DOTS_context.fillRect(0, 0, DOTS_canvas.width, DOTS_canvas.height);

	var offsetX = Math.floor((DOTS_placeWidth - DOTS_tileWidth) / 2);
	var offsetY = Math.floor((DOTS_placeHeight - DOTS_tileHeight) / 2);

	for (var j = 0; j < DOTS_numRows; j++) {

		for (var i = 0; i < DOTS_numCols; i++) {

			var index = DOTS_IndexFromCoords(i, j);

			if (DOTS_tiles[index].isActive === true) {

				DOTS_context.fillStyle = DOTS_tileActiveColor;
			}
			else if (DOTS_tiles[index].isPlaying === true) {

				DOTS_context.fillStyle = DOTS_tileInactiveCurrentCollor;
			}
			else {

				DOTS_context.fillStyle = DOTS_tileInactiveColor;
			}

			DOTS_context.fillRect( i * DOTS_placeWidth + offsetX, j * DOTS_placeHeight + offsetY, DOTS_tileWidth, DOTS_tileHeight);
		}
	}
}

function DOTS_ResizeBoard(rows, cols) {

	DOTS_numRows = rows;
	DOTS_numCols = cols;

	DOTS_placeWidth = Math.floor(DOTS_canvas.width / DOTS_numCols);
	DOTS_placeHeight = Math.floor(DOTS_canvas.height / DOTS_numRows);

	DOTS_tileWidth = Math.floor(DOTS_placeWidth * DOTS_tilePercentage);
	DOTS_tileHeight = Math.floor(DOTS_placeHeight * DOTS_tilePercentage);

	DOTS_canvas.width = DOTS_placeWidth * DOTS_numCols;
	DOTS_canvas.height = DOTS_placeHeight * DOTS_numRows;

}

/******************************************************************************/
/** Dots Logic **/

function DOTS_getMousedTile(pageX, pageY) {

	var rect = DOTS_canvas.getBoundingClientRect();

	var mousePixel = {
		x: pageX - rect.left,
		y: pageY - rect.top
	};

	if (mousePixel.x < 0 || mousePixel.y < 0 || mousePixel.x >= DOTS_canvas.width || mousePixel.y >= DOTS_canvas.height) {

		DOTS_mouseDown = false;
		DOTS_inputChange = true;
		return null;
	}

	return {
		x: Math.floor(mousePixel.x / DOTS_placeWidth),
		y: Math.floor(mousePixel.y / DOTS_placeHeight)
	};
}

var DOTS_activeColumn = 0;
function DOTS_AdvanceActiveColumn() {

	DOTS_activeColumn++;
	if (DOTS_activeColumn >= DOTS_numCols) {
		DOTS_activeColumn = 0;
	}
}

function DOTS_PreviousColumn() {
	if (DOTS_activeColumn > 0) {
		return DOTS_activeColumn - 1;
	}
	else {
		return DOTS_numCols - 1;
	}
}

function DOTS_UpdateActiveColumn() {

	var oldColStart = DOTS_IndexFromCoords(DOTS_PreviousColumn(), 0);
	var currColStart = DOTS_IndexFromCoords(DOTS_activeColumn, 0);

	for(var i = 0; i < DOTS_numRows; ++i)
	{
		DOTS_tiles[oldColStart + i].isPlaying = false;
		DOTS_tiles[currColStart + i].isPlaying = true;
	}
}

function DOTS_PlayActivatedColumn() {
	var colStart = DOTS_IndexFromCoords(DOTS_activeColumn, 0);

	for (var i = 0; i < DOTS_numRows; ++i) {

		if (DOTS_tiles[colStart + i].isActive === true) {

			// play its sound
			DOTS_Sound(DOTS_sounds[i], DOTS_volume);
		}
	}
}

function DOTS_LogicUpdate() {

	DOTS_AdvanceActiveColumn();
	DOTS_UpdateActiveColumn();
	
}

var DOTS_mouseDown = false;

DOTS_canvas.onmousedown = function () {
	DOTS_mouseDown = true;
};

DOTS_canvas.onmouseup = function () {
	DOTS_mouseDown = false;
	DOTS_inputChange = true;
};

function DOTS_togglePause() {

	DOTS_paused = !DOTS_paused;
}

function DOTS_advanceOneFrame() {

	var pauseState = DOTS_paused;
	DOTS_paused = false;
	DOTS_update();
	DOTS_paused = pauseState;
}

function DOTS_changeSpeed(newSpeed) {

	clearInterval(DOTS_mainLoop);
	DOTS_mainLoop = setInterval(DOTS_update, 1000 / newSpeed);
}

function DOTS_AddColumn() {

	if (DOTS_numCols >= DOTS_maxCols) {
		return;
	}
	DOTS_ClearBoard();
	DOTS_numCols++;
	DOTS_canvas.width += DOTS_placeWidth;
	DOTS_drawTiles();
}

function DOTS_RemoveColumn() {

	if (DOTS_numCols <= DOTS_minCols) {
		return;
	}
	DOTS_ClearBoard();
	DOTS_numCols--;
	DOTS_canvas.width -= DOTS_placeWidth;
	DOTS_drawTiles();
}

function DOTS_ClearBoard() {

	var numTiles = DOTS_numRows * DOTS_numCols;

	for(var i = 0; i < numTiles; ++i)
	{
		DOTS_tiles[i].isActive = false;
		DOTS_tiles[i].setActive = false;
		DOTS_tiles[i].isPlaying = false;
	}
	DOTS_drawTiles();
}

function DOTS_setVolume(newVolume) {

	DOTS_volume = newVolume / 100;
}

/******************************************************************************/
/** Sound **/
/** Modified from post here: https://stackoverflow.com/questions/11330917/how-to-play-a-mp3-using-javascript **/

function DOTS_Sound(source, volume) {

	//Create the audio tag
	var soundFile = document.createElement("audio");
	soundFile.preload = "auto";

	//Load the sound file (using a source element for expandability)
	var src = document.createElement("source");
	src.src = source;
	soundFile.appendChild(src);

	//Load the audio tag
	//It auto plays as a fallback
	soundFile.load();
	soundFile.volume = volume;
	soundFile.play();
}

/******************************************************************************/


function DOTS_start() {

	for (var i = 0; i < DOTS_numCols; i++) {

		for (var j = 0; j < DOTS_numRows; j++) {

			DOTS_tiles.push({isActive: false, setActive: false, isPlaying: false});
		}
	}

	DOTS_UpdateActiveColumn();
	DOTS_drawTiles();
	DOTS_paused = true;
}

function DOTS_update() {
	
	if (DOTS_paused === false) {

		DOTS_UnpausedUpdate();
	}
}

function DOTS_UnpausedUpdate() {

	DOTS_LogicUpdate();
	DOTS_PlayActivatedColumn();
	DOTS_drawTiles();
}

function DOTS_MouseInput(event) {

	DOTS_mousePos = { x: event.clientX, y: event.clientY };
}

function DOTS_inputUpdate()
{
	if (DOTS_mouseDown === true) {

		var mouseTilePos = DOTS_getMousedTile(DOTS_mousePos.x, DOTS_mousePos.y);

		if (mouseTilePos === null) {
			return;
		}

		var index = DOTS_IndexFromCoords(mouseTilePos.x, mouseTilePos.y);

		if (DOTS_inputChange === true) {

			DOTS_inputChange = false;

			if(DOTS_tiles[index].isActive === false) {

				DOTS_inputAdd = true;
			}
			else {

				DOTS_inputAdd = false;
			}
		}

		if (DOTS_inputAdd === true) {

			DOTS_tiles[index].isActive = true;
			DOTS_tiles[index].setActive = true;
		}
		else {

			DOTS_tiles[index].isActive = false;
			DOTS_tiles[index].setActive = false;
		}

		DOTS_drawTileAtIndex(index);
	}
}

function DOTS_mainOnLoad() {

	DOTS_start();
	DOTS_mainLoop = setInterval(DOTS_update, DOTS_dt);
	setInterval(DOTS_inputUpdate, 1000 / 60);
}
