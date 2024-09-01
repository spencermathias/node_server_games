// button to get new tiles
// print new points to the chat log or make a grid showing all turn scores and total
// put chat log behind a button for mobile; only show the last message for a second

//events


window.addEventListener('load', function() {
	var lastTouch = {x:0, y:0};
	
	var touchstartHandler = function(e) {
		lastTouch.x = e.touches[0].clientX;
		lastTouch.y = e.touches[0].clientY;
		//console.log(lastTouch);
		// if(!soundsAllowed){
			// console.log('allow sounds');
			// ding.play();
			// //ding.pause();
			// soundsAllowed = true;
		// }
	}

	var touchmoveHandler = function(e) {
		var touchX = e.touches[0].clientX;
		var touchY = e.touches[0].clientY;
		var dx = touchX - lastTouch.x;
		var dy = touchY - lastTouch.y;
		lastTouch.x = touchX;
		lastTouch.y = touchY;

		e.preventDefault(); //prevent scrolling, scroll shade, and refresh
		board.x += dx;
		board.y += dy;
		return;
	}

  document.getElementById('gameBoard').addEventListener('touchstart', touchstartHandler, {passive: false });
  document.getElementById('gameBoard').addEventListener('touchmove', touchmoveHandler, {passive: false });
  console.log('added');
  document.getElementById('gameBoard').addEventListener('click', checkClick);
  document.getElementById('title').addEventListener('click', titleFunction);
  document.getElementById('middle').addEventListener('click', allowAudio);
});

$('#submit').click(function(){
	var data = {
		message:$('#message').val()         
	}
	socket.send(JSON.stringify(data)); 
	$('#message').val('');
	return false;
});

document.getElementById('title').style.color = '#ff0000'
function titleFunction(){
	let title = document.getElementById('title')
	if ( title.style.color == 'rgb(255, 0, 0)' ){
		title.style.color = '#00ff00';
		socket.emit('gameCommands',{command:'ready'});
	} else {
		title.style.color = '#ff0000';
		socket.emit('gameCommands',{command:'ready'});
	}
	return false;
}

var soundsAllowed = false;
var ding = new Audio('./sounds/echoed-ding.mp3');
function allowAudio(){
	if (!soundsAllowed){
		ding.load();
		soundsAllowed = true;
	}
}


var tileWidth = 40 //* window.devicePixelRatio;
var tileHeight = 40 //* window.devicePixelRatio;
var tileFontSize = 30 //* window.devicePixelRatio;
var tilePadding = 5;
var allTiles = [];
var serverTiles = [];
var selected = undefined;
var scoreIsValid = false;	

var canvas = document.getElementById("gameBoard");
var ctx = canvas.getContext("2d");
//console.log('ctx', ctx);
//console.log(canvas.width, canvas.height);

class Button {
	constructor(x, y, width, height, text = "button", fillColor, outlineColor, textColor, textOutlineColor, fontSize = 50, textSlant = false){
		this.updateSize(x,y,width,height);
		this.fillColor = fillColor;
		this.outlineColor = outlineColor;
		this.textColor = textColor;
		this.textOutlinecolor = textOutlineColor;
		this.fontSize = fontSize;
		this.text = text;
		this.textSlant = textSlant;
		this.visible = true;
	}
	
	updateSize(x,y,width,height){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.clickArea = {minX: x - width/2, minY: y - height/2, maxX: x + width/2, maxY: y + height/2};
	}
	
	draw(ctx){
		if(this.visible){
			ctx.save();
			ctx.fillStyle = this.fillColor;
			ctx.strokeStyle = this.outlineColor;
			roundRect(ctx, this.clickArea.minX, this.clickArea.minY, this.width, this.height, this.width/8, this.fillColor != undefined, this.outlineColor != undefined);

			//draw number
			ctx.font = '' + this.fontSize + "px Arimo" //Arial Black, Gadget, Arial, sans-serif";
			ctx.fillStyle = this.textColor;
			ctx.strokeStyle = this.textOutlineColor;
			ctx.translate(this.x, this.y);
			if(this.textSlant){
				ctx.rotate(Math.atan(this.height/this.width));
			}
			if(this.textColor != undefined){
				ctx.fillText(this.text,0,0);
			}
			if(this.textOutline != undefined){
				ctx.strokeText(this.text, 0, 0);
			}
			ctx.restore();
		}
	}
	
	click(){
		console.log("This button has not been overloaded yet!");
	}
} 

class Tile extends Button{
	constructor(tileData, x,y,width,height,fontSize){
		var text = -1;
		if(tileData != undefined){
			text = tileData.number
		}
		super(x,y,width,height,text,defaultTileColor,'#000000','#000000',undefined,fontSize,false);
		this.tileData = tileData;
		this.visible = (text >= 0);
		this.highlightColor = "";
	}
	
	drawOutline(color){
		this.highlightColor = color;
	}
	
	updateData(tileData){
		this.tileData = tileData;
		if(tileData != undefined){
			this.text = this.tileData.number
			this.visible = (this.tileData.number >= 0);
		}
	}
	
	draw(ctx){
		if(this.highlightColor != ""){
			//console.log(this.highlightColor);
			ctx.save();
			ctx.fillStyle = this.highlightColor;
			roundRect(ctx, this.x-(this.width/2 + tilePadding), this.y-(this.height/2 + tilePadding), this.width+2*tilePadding, this.height+2*tilePadding, this.width/8,true, false);
			ctx.restore();
			this.highlightColor = "";
		}
		super.draw(ctx);
	}
}

class MoveTile extends Tile	{
	constructor(tileData, x,y,width,height,fontSize){
		super(tileData, x,y,width,height,fontSize);
	}
	
	click(){
		if(selected != undefined){ //switch
			console.log("switch", selected.tileData, this.tileData);
			if(selected.tileData != undefined){
				var tempNumber = selected.tileData.number;
				var tempOwner = selected.tileData.owner;
				var tempId = selected.tileData.id;
				selected.updateData(this.tileData);
				this.updateData({owner: tempOwner, number: tempNumber, id: tempId})
				selected = undefined;
			} else {
				this.tileData = undefined;
			}
		} else { //select
			selected = this;
		}
		
		updatePlayValidity();
		//console.log("I am tile of number: " + this.tileData.number + " and Id: " + this.tileData.id, this);
	}
}

class SubmitButton extends Button{
	constructor(){
		super(canvas.width/2, 60, tileWidth*4, tileHeight,"SUBMIT",'#0000ff',undefined,'#ffffff',undefined,tileFontSize,false)
	}
	click(){
		if(this.visible){
			var sendState = getTileData(newState);	
			console.log("sending to server"); 
			socket.emit('gameCommands',{command:"newBoardState", data:sendState});				
		}
	}
}

function getTileData( state ){
	var sendState = [];
	for(var row = 0; row < state.length; row++){
		var line = [];
		for(var col = 0 ; col < state[row].length; col++){
			line.push(state[row][col].tileData);
		}
		sendState.push(line);
	}
	return sendState;
}

class Board {
	constructor(x, y, rows, columns, rowThickness, columnThickness){
		this.x = x;
		this.y = y;
		this.rows = rows;
		this.columns = columns;
		this.rowThickness = rowThickness;
		this.columnThickness = columnThickness;
		this.borderColor = '#0000CD';
		this.backgroundColor = '#4682B4';
		this.lineColor = '#B0C4DE';
		this.lineWidth = 2;
		
	}
	
	updateFromServer(recievedBoardState){
		this.rows = recievedBoardState.length;
		if(recievedBoardState.length > 0){
			this.columns = recievedBoardState[0].length;
		}
		
		if(boardState.length != recievedBoardState.length || boardState[0].length != recievedBoardState[0].length){ //new boardState if different size
			boardState = [];
			if(recievedBoardState.length > 0 && recievedBoardState[0].length > 0){
				for(var row = 0; row < recievedBoardState.length; row++){
					var line = [];
					for(var col = 0; col < recievedBoardState[0].length; col++){
						line.push(new Tile(shared.newBlankTile(), 0, 0, tileHeight, tileWidth, tileFontSize));
					}
					boardState.push(line);
				}
			}
		}
		
		for(var row = 0; row < recievedBoardState.length; row++){
			for(var col = 0; col < recievedBoardState[0].length; col++){
				if(boardState[row][col].tileData.id != recievedBoardState[row][col].id){
					boardState[row][col].fillColor = newServerTileColor;
				} else {
					boardState[row][col].fillColor = defaultTileColor;
				}
				boardState[row][col].updateData(recievedBoardState[row][col]);
			}
		}
	}
	
	draw(ctx){
		if (this.rows > 0 && this.columns >0){
			ctx.save()
			var bh = this.rows*this.rowThickness;
			var bw = this.columns*this.columnThickness;
			//console.log(xPos, yPos, rows, columns, rowThickness, columnThickness)
			//console.log(xPos, yPos,bw, bh);
			var xMin = this.x - bw/2;
			var xMax = this.x + bw/2;
			var yMin = this.y - bh/2;
			var yMax = this.y + bh/2;
			
			//border
			ctx.fillStyle = this.borderColor;
			var border = Math.min(.01*bw, .01*bh);
			ctx.fillRect(xMin - border, yMin - border, bw + 2*border, bh + 2*border);
			//background
			ctx.fillStyle = this.backgroundColor;
			ctx.fillRect(xMin,yMin,bw, bh);
			//center marker
			ctx.fillStyle = this.lineColor;
			ctx.fillRect(this.x - 0.5*this.rowThickness, this.y - 0.5*this.columnThickness, this.columnThickness, this.rowThickness);
			//lines
			ctx.strokeStyle = this.lineColor;
			ctx.lineWidth = this.lineWidth;
			for (var x = xMin; x <= xMax; x += this.columnThickness) {
				ctx.moveTo(0.5 + x, 0.5 + yMin);
				ctx.lineTo(0.5 + x, 0.5 + yMax);
			}

			for (var y = yMin; y <= yMax; y += this.rowThickness) {
				ctx.moveTo(0.5 + xMin, 0.5 + y);
				ctx.lineTo(0.5 + xMax, 0.5 + y);
			}
			ctx.stroke();
			var y = yMin;
			for (var i = 0; i < this.rows; i++) {
				var x = xMin;
				for(var j = 0; j < this.columns; j++){
					boardState[i][j].updateSize(x+this.columnThickness/2, y+this.rowThickness/2, tileWidth, tileHeight);
					newState[i][j].updateSize(x+this.columnThickness/2, y+this.rowThickness/2, tileWidth, tileHeight);
					
					if(newState[i][j].tileData.id != shared.blankTile.id && boardState[i][j].tileData.id != shared.blankTile.id){
						newState[i][j].drawOutline('#ff0000');
					}
					shapes[1].push(newState[i][j]);//middle layer
					shapes[2].push(boardState[i][j]); //bottom layer
					x += this.columnThickness;
				}
				y += this.rowThickness;
			}
			ctx.restore();
		}
	}
}

//socket stuff


var socket = io(window.location.href); 
socket.on('connect', () => {
    //socket.emit('gameCommands',{command:'addPlayer'});
	console.log("Connection successful!")
});

socket.on('getOldID',(callBack)=>{
	if(localStorage.id !== undefined){
		console.log(localStorage)
		callBack({ID:localStorage.id,name:localStorage.userName})
	}
	localStorage.id = socket.id;
	socket.emit('gameCommands',{command:'addPlayer',data:localStorage.userName});
})
socket.on('forward to room',(path)=>{
	console.log('move to path:',path)
	window.location.href=path
})
socket.on('allTiles', function(inAllTiles){
	allTiles = inAllTiles;
});

function changeName(userId){
	if(userId == socket.id){
		var userName = null;
		do{
			userName = prompt('Enter username: ');
			//console.log(userName);
			if ((userName == null || userName == "") && localStorage.userName !== undefined){
				userName = localStorage.userName;
			}
		} while (userName === null);
		localStorage.userName = userName;
		socket.emit("userName", localStorage.userName);
	}
}

/*Initializing the connection with the server via websockets */
var myTiles = [];
var boardState = [[]];
var newState = [[]];
var board = new Board(canvas.width/2, canvas.height/2, boardState.length, boardState[0].length, tileHeight+2*tilePadding, tileWidth+2*tilePadding);
var submitButton = new SubmitButton();
var shapes = [[],[],[]];
var userList = [];
var spectatorColor = "#444444";
var yourTurnColor = "#0000ff";
var newTileColor = "#ffff00";
var placeholderColor = '#444444';
var validPlayColor = '#00ff00';
var invalidPlayColor = '#ff0000';
var defaultTileColor = '#ffe0b3';
var newServerTileColor = '#aae0b3';
var myTurn = false;
var myUserlistIndex = 'spectator';
var myUserlistString = "";

socket.on("message",function(message){  
	/*
		When server sends data to the client it will trigger "message" event on the client side , by 
		using socket.on("message") , one cna listen for the ,message event and associate a callback to 
		be executed . The Callback function gets the dat sent from the server 
	*/
	//console.log("Message from the server arrived")
	message = JSON.parse(message);
	//console.log(message); /*converting the data into JS object */
	
	$('#chatlog').append('<div style="color:'+message.color+'">'+message.data+'</div>'); /*appending the data on the page using Jquery */
	$('#response').text(message.data);
	//$('#chatlog').scroll();
	$('#chatlog').animate({scrollTop: 1000000});
});

socket.on('userList',function(data){
	var userListString = '';
	userList = data;
	for( var i = 0; i < data.length; i++ ){
		var header = 'div id="userListDiv'+ i + '"';
		var click = 'onclick="changeName(' + "'" + data[i].id + "'" + ')"';
		var color = ' style="color: ' + data[i].color + ';"'
		var string = '' + data[i].userName;
		var ender = '</div>';
		
		if(data[i].color != spectatorColor){
			string = string + " " + data[i].score;
			
			if(data[i].id == socket.id){
				if(soundsAllowed && !myTurn && data[i].color == yourTurnColor){
					ding.play(); //play ding when it becomes your turn
				} 
				myTurn = data[i].color == yourTurnColor; //update old status
				
				myUserlistIndex = i;
				myUserlistString = string;
			}
		}
		
		userListString = userListString + '<' + header + click + color + '>' + string + ender;
		//console.log( "player", data[i].userName, "myTurn", myTurn, "id", data[i].id, socket.id, "color", data[i].color, yourTurnColor);
	}
	document.getElementById('userlist').innerHTML = userListString;
	console.table(data);
});

socket.on('showBoard',function(data){
	$('#title').css('color', data.titleColor);
	$('#content').css('display', data.displayTitle);
	$('#gameBoard').css('display', data.displayGame);
	resizeCanvas();
});

socket.on('tiles', function(tiles){
	serverTiles = tiles;
	for (var i = 0; i < newState.length; i++){ //clear whats on board
		for (var j = 0; j < newState[i].length; j++){
			newState[i][j].updateData(shared.newBlankTile());
		}
	}
	myTiles = [];
	for(var i = 0; i < tiles.length; i++){
		var tile = new MoveTile(tiles[i], (canvas.width/2) + (tileWidth + 20) * (i-2) , canvas.height - (tileHeight + 20), tileHeight, tileWidth, tileFontSize);
		tile.fillColor = newTileColor;
		tile.drawOutline(placeholderColor); //placeholder outline
		shapes[0].push(tile);//1st layer
		myTiles.push(tile);
	}
	
	//resizeDrawings();
	console.log('tiles updated: ', myTiles);
});

socket.on('boardState', function(recievedBoardState){
	board.updateFromServer(recievedBoardState);
	
	if(newState.length != recievedBoardState.length || newState[0].length != recievedBoardState[0].length){ //clear new state if different size
		//TODO: move tiles in newState back to hand
		newState = [];
		if(boardState.length > 0 && boardState[0].length > 0){
			for(var row = 0; row < boardState.length; row++){
				var line = [];
				for(var col = 0; col < boardState[0].length; col++){
					var tile = new MoveTile(shared.newBlankTile(), 0, 0, tileHeight, tileWidth, tileFontSize);
					tile.fillColor = newTileColor;
					line.push(tile);
					//line.push(shared.newBlankTile());
				}
				newState.push(line);
			}
		}
	}
	
	updatePlayValidity();
});

function updatePlayValidity(){
	if(myUserlistIndex!='spectator'){
		var check = shared.validTilesToPlay(serverTiles, getTileData(newState), getTileData(boardState), allTiles);
		if(check.error.length == 0){
			$('#userListDiv'+myUserlistIndex)[0].innerHTML = (myUserlistString + " + " + check.score);
		} else {
			$('#userListDiv'+myUserlistIndex)[0].innerHTML = (myUserlistString);
		}
		scoreIsValid = check.error.length == 0;
		//console.log("check", check);
	}
}

function checkClick(event){
	var foundClick = false;
	var i;
	var area;
	var offset = $('#gameBoard').position();
	var scale = {x: canvas.width / $('#gameBoard').width(), y: canvas.height/ $('#gameBoard').height()};
	//console.log('click', {x: event.clientX, y: event.clientY});
	//console.log('scale:', scale)
	var click = {x: event.clientX*scale.x - offset.left, y: event.clientY*scale.y - offset.top};
	console.log('adjusted click: ', click);
	for( i = 0; i < shapes.length; i += 1){
		for(var j = 0; j < shapes[i].length; j++){
			if( shapes[i][j].clickArea ){
				area = shapes[i][j].clickArea;
				//console.log(area);
				if( click.x  < area.maxX){
					if( click.x > area.minX){
						if( click.y < area.maxY){
							if( click.y > area.minY){
								shapes[i][j].click()
								foundClick = true;
							}
						}
					}
				}
			} else {
				console.log('no click area');
			}
		}
		if(foundClick){break;}
	}
	if(!foundClick){
		selected = undefined;
	}
}

//drawing stuff

function draw(){
	shapes = [[],[],[]]; //first object is top layer, second is middle, last is bottom layer
	ctx.textAlign="center";
	ctx.textBaseline = "middle";
	//console.log('draw: ', shapes );
	ctx.clearRect(0,0,canvas.width, canvas.height);
	
	//var radius = (Math.min(canvas.width, canvas.height-140)/2)-50;
	
	//board
	if(boardState.length > 0){
		board.draw(ctx);
	}
	
	//player tiles
	for(var i = 0; i < myTiles.length; i++){
		//if(myTurn){
		if(scoreIsValid){
			myTiles[i].drawOutline(validPlayColor);
		} else {
			myTiles[i].drawOutline(invalidPlayColor);
		}
		//} else {
		//	myTiles[i].drawOutline('#444444'); //placeholder outline
		//}
		shapes[0].push( myTiles[i] );//1st layer
	}
	
	//selected outline
	if(selected != undefined){
		//debugger;
		selected.drawOutline('#0000ff');
	}
	
	//button
	if(myTurn){
		submitButton.visible = true;
		shapes[0].push(submitButton);
	} else {
		submitButton.visible = false;
	}
	
	//draw cards
	for( var i = shapes.length-1; i >= 0; i -= 1){
		//if(i==0 && shapes[0].length > 0){debugger;}
		for(var j = 0; j < shapes[i].length; j++){
			shapes[i][j].draw(ctx);
		}
	}
	setTimeout(draw, 100); //repeat
}
draw();

function resizeCanvas(){
	canvas.width = canvas.parentElement.scrollWidth; //window.innerWidth - $('#sidebar').width() - 50;
	canvas.height = canvas.parentElement.scrollHeight; //window.innerHeight - $('#bidOverlay').height()- 50;
	console.log('canvas resized to: ', canvas.width, canvas.height);
	resizeDrawings();
}

function resizeDrawings(){
	tileWidth = 40; //* window.devicePixelRatio;
	tileHeight = 40; //* window.devicePixelRatio;
	tilePadding = tileWidth/20;
	tileFontSize = 30; //* window.devicePixelRatio;
	board.x = canvas.width/2;
	board.y = canvas.height/2;
	board.rowThickness = tileHeight + 2*tilePadding;
	board.columnThickness = tileWidth + 2*tilePadding;
	
	for(var i = 0; i < myTiles.length; i++){
		myTiles[i].updateSize((canvas.width/2) + (tileWidth + 20) * (i-2) , canvas.height - (tileHeight + 20), tileHeight, tileWidth);
	}
	submitButton.updateSize(canvas.width/2, 60, tileWidth*4, tileHeight);
}

/*
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object 
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
 
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
	stroke = true;
  }
  if (typeof radius === 'undefined') {
	radius = 5;
  }
  if (typeof radius === 'number') {
	radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
	var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
	for (var side in defaultRadius) {
	  radius[side] = radius[side] || defaultRadius[side];
	}
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
	ctx.fill();
  }
  if (stroke) {
	ctx.stroke();
  }
}

function polygon(ctx, x, y, radius, sides, startAngle, anticlockwise) {
	if (sides < 3) return;
	var a = (Math.PI * 2)/sides;
	a = anticlockwise?-a:a;
	ctx.save();
	ctx.translate(x,y);
	ctx.rotate(startAngle);
	ctx.moveTo(radius,0);
	for (var i = 1; i < sides; i++) {
		ctx.lineTo(radius*Math.cos(a*i),radius*Math.sin(a*i));
	}
	ctx.closePath();
	ctx.restore();
}