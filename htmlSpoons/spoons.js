
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

  document.addEventListener('touchstart', touchstartHandler, {passive: false });
  document.addEventListener('touchmove', touchmoveHandler, {passive: false });
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
var soundsAllowed=true
var ding = new Audio('../sounds/echoed-ding.mp3');
function allowAudio(){
	if (!soundsAllowed){
		ding.load();
		soundsAllowed = true;
	}
}

var gameState={
		LOBBY:0,
		PLAY:1
	}
var gameStatus=gameState['LOBBY']
var userList=[]
var readyColor = "#ffffff";
var notReadyColor = "#ff0000";
var myCards=[]
var handheight=0
var myUserlistIndex=-1
var myUserlistString=''
var myTurn=false
var yourTurnColor = "#0000ff";
var myHandIDs=[]
var spoons=[]
//TODO:make shared file
var deck=new Deck({number:[...Array(15).keys()],color: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#FF8C00", "#ff00ff"]})
														//red       green       blue     yellow      orange     purple
var canvas = document.getElementById("gameBoard");
var ctx = canvas.getContext("2d");
deck.setDfltCardProps(50,(card)=>{
    let temp={
        text:card.number,
        textColor:card.color
    }
    return temp 
});
//socket stuff
var socket = io(window.location.href)
socket.on('connect', () => {
    //socket.emit('gameCommands',{command:'addPlayer'});
    console.log('sent')
});
socket.on('userList',updatepublic)
socket.on('updateUser',updateUser)
socket.on('getOldID',(callBack)=>{
	if(localStorage.id !== undefined){
		console.log(localStorage)
		callBack({ID:localStorage.id,name:localStorage.userName})
	}
	localStorage.id = socket.id;
	socket.emit('gameCommands',{command:'addPlayer'});
})
socket.on('forward to room',(path)=>{
	console.log('move to path:',path)
	window.location.href=path
})
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

//socket functions
function updateUser(data){
	myHandIDs=data.handIDs
	myCards = [];
	let cardWidth=deck.dfltCardProps.width
	let cardHeight=deck.dfltCardProps.hwRatio*cardWidth
	for(var i = 0; i < myHandIDs.length; i++){
		let card = deck.makeCardObject(myHandIDs[i],(canvas.width/2) + (cardWidth + 20) * (i-2.5),canvas.height - (cardHeight- 20))
		card.click=()=>{
			socket.emit('gameCommands',{command:'passCard',data:card.deckProps.ID})
		}
		myCards.push(card);
	}
	//resizeDrawings();
	console.log('hand updated: ', myCards);
	draw()
}

function updatepublic(data){
	let userListString = '';
	let advance=(gameStatus==gameState.LOBBY)
	let spoonCount=data.length-1
	userList = data;
	for( var i = 0; i < data.length; i++ ){
		var header = 'div id="userListDiv'+ i + '"';
		var click = 'onclick="changeName(' + "'" + data[i].ID + "'" + ')"';
		var color = ' style="color: ' + data[i].ready?readyColor:notReadyColor + ';"'
		var string = '' + data[i].userName;
		var ender = '</div>';
		advance=advance&&data[i].ready
		
		if(data[i].ID == socket.id){
			console.log('socket match')
			if(soundsAllowed && !myTurn && data[i].color == yourTurnColor){
				ding.play(); //play ding when it becomes your turn
			} 
			myTurn = data[i].color == yourTurnColor; //update old status
			
			myUserlistIndex = i;
			myUserlistString = string;
		}
		if(data[i].spoon){
			string = string + ' 🥄';
			spoonCount--
			
		}
		userListString = userListString + '<' + header + click + color + '>' + string + ender;
		//console.log( "player", data[i].userName, "myTurn", myTurn, "id", data[i].id, socket.id, "color", data[i].color, yourTurnColor);
	}
	if(gameStatus==gameState['LOBBY']){
		showBoard(advance?true:data[myUserlistIndex].ready,advance)
	}
	if(gameStatus!=gameState['LOBBY']){
		spoons=[]
		let cardWidth=deck.dfltCardProps.width
		let cardHeight=cardWidth*deck.dfltCardProps.hwRatio
		for(var i = 0; i < spoonCount; i++){
			let spoon = new Card({ID:'spoon'},(canvas.width/2) + (cardWidth + 20) * (i%6-2.5),(cardHeight+ 20)/2+(cardHeight+20)*Math.floor(i/6),cardWidth,cardHeight,"🥄",cardWidth)
			spoon.click=()=>{
				if(myCards.every((currentCard) => currentCard.deckProps.number == myCards[0].deckProps.number)||spoonCount<data.length-1){
					socket.emit('gameCommands',{command:'pickSpoon'})
				}
			}
			spoons.push(spoon);
		}
		if(spoonCount==0){
			let spoon = new Card({ID:'restart'},(canvas.width/2) + (cardWidth + 20) * (i%6-2.5),(cardHeight+ 20)/2+(cardHeight+20)*Math.floor(i/6),cardWidth,cardHeight,"restart",50,'#ffe0b3','#000000', '#000000', '#000000', false)
			spoon.click=()=>{
				socket.emit('gameCommands',{command:'restart'})
			}
			spoons.push(spoon);
		}
		draw()
	}
	document.getElementById('userlist').innerHTML = userListString;
	console.table(data);
};

function showBoard(ready,showBoard){
	if(showBoard){
		$('#content').css('display',  "none" );
		$('#gameBoard').css('display',  "flex" );
		gameStatus=gameState.PLAY

		resizeCanvas()
	}else{
		$('#content').css('display',"flex")
		$('#gameBoard').css('display',"none")
	}
	$('#title').css('color', ready?"#00ff00":"#ff0000");
};

function titleFunction(){
	let title = document.getElementById('title')
	socket.emit('gameCommands', {command:'ready'})
}
function resizeCanvas(){
	canvas.width = window.innerWidth - $('#sidebar').width() - 50;
	canvas.height = window.innerHeight - 2;
	console.log('canvas resized to: ', canvas.width, canvas.height);
	resizeDrawings();
}
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

function resizeDrawings(){
	let cardWidth=Math.min(canvas.width/7,canvas.height/(2*deck.dfltCardProps.hwRatio))
	deck.dfltCardProps.width=cardWidth
	let cardHeight=cardWidth*deck.dfltCardProps.hwRatio
	for(var i = 0; i < myCards.length; i++){
		myCards[i].updateSize((canvas.width/2) + (cardWidth + 20) * (i-2.5) , canvas.height - (cardHeight- 20), cardHeight, cardWidth);
	}
	for(var i = 0; i < spoons.length; i++){
		spoons[i].updateSize((canvas.width/2) + (cardWidth + 20) * (i-2.5) , canvas.height - (cardHeight- 20), cardHeight, cardWidth);
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
		//selected = undefined;
	}
}

function draw(){
	shapes = [[],[],[]]; //first object is top layer, second is middle, last is bottom layer
	ctx.textAlign="center";
	ctx.textBaseline = "middle";
	ctx.clearRect(0,0,canvas.width, canvas.height);
	
	shapes[0]=myCards.concat(spoons)
	
	for( var i = shapes.length-1; i >= 0; i -= 1){
		//if(i==0 && shapes[0].length > 0){debugger;}
		for(var j = 0; j < shapes[i].length; j++){
			shapes[i][j].draw(ctx);
		}
	}
}
//🥄