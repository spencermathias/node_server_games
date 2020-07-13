try{
	Deck=require('./deck.js')
	process.on('message', MessageIn);
	function updateEachUser(){
		for(let i in playerIDs){
			process.send(playerIDs[i],'updateUser',players[i].private)
		}
	}
	function updateALLUsers(){
		process.send('all','updatepublic',publicItems)
	}
	function messageOut(ID, message, color){
		var messageObj = {
			data: "" + message,
			color: color
		};
		process.send(ID,'message',JSON.stringify(messageObj));
	}
}
catch(err){
	function updateEachUser(){
		for(let i in playerIDs){
			console.log(playerIDs[i],'updateUser',players[i].private)
		}
	}
	function updateALLUsers(){
		console.log('all','updatepublic',publicItems)
	}
	function messageOut(ID, message, color){
		var messageObj = {
			data: "" + message,
			color: color
		};
		console.log(ID,'message',JSON.stringify(messageObj));
	}
}


function fetchlobbies(){
	fetch('/lobbies')
		.then((response)=>{
			return response.json()
		}).then((data)=>{
			loadgames(data)
		})
	}
var dummyID=0
function loadgames(currentGames){
	//let ul = document.getElementById("ulMessages");
	while($("ul")[0].firstChild) $("ul")[0].firstChild.remove();
	if(currentGames.length==0){
		$("ul").append("<li> No games are currently avalible </li>")
	}else{
		for(let i = currentGames.length-1;i>=0; i--){
			let game = currentGames[i];
			//let gameInfo = game.split(':')
			game.url=''+game.type+''+game.ID
			let appendString='<li>'+
								`<div id="title" onclick="send2game('${game.url}')"> ${game.type}</div>`+
								'<div id="subtitle">Click to Start</div>'+
							'</li>'
			$("ul").append(appendString)
		}
	}
}
function createNewGame(type){
	if(type!='Cancel'){
		//let clickfnct='send2game('type')'
		let gameID=createServer(type)
		let appendString='<li>'+
							`<div id="title" onclick="send2game('`+gameID+`')">`+type+'</div>'+
							'<div id="subtitle">Click to Start</div>'+
						'</li>'
		$("ul").append(appendString)
		document.getElementById("new_game").value = "Cancel";
		currentGames.push(gameID)
		send2game(gameID)
	}
}
function send2game(game){
	//TODO check if game is still ready not started-----------------/
	//console.log('send player to a '+type+' game')
	if(game=='cribbage1'){
		location.href = "/cribbage1"
	}else{
		console.log('send player to: /'+game)
		location.href = "http://alanisboard.ddns.net:8082/"
	}
}
function createServer(type){
	dummyID++
	console.log('created server with ID: '+type)

	return type+':'+dummyID
}
fetchlobbies()
setInterval(fetchlobbies,9000)


//create socket
var socket = io(Addresses.publicAddress); //try public address //"24.42.206.240" for alabama

var trylocal = 0;
socket.on('connect_error',function(error){
	console.log("I got an error!", error);
	console.log("socket to:", socket.disconnect().io.uri, "has been closed.");
	if(!trylocal){ //prevent loops
		if(window.location.href != internalAddress){
			window.location.replace(internalAddress);
		}
		socket.io.uri = internalAddress;
		console.log("Switching to local url:", socket.io.uri);
		console.log("Connecting to:",socket.connect().io.uri);
		trylocal = 1;
	}
});

socket.on('reconnect', function(attempt){
	console.log("reconnect attempt number:", attempt);
});

socket.on('connect', function(){
	//get userName
	console.log("Connection successful!");
	if(localStorage.userName === undefined){
		changeName(socket.id);
	} else {
		socket.emit('userName', localStorage.userName);
	}
	
	if(localStorage.id !== undefined){
		socket.emit('oldId', localStorage.id);
	}
	localStorage.id = socket.id;
});
socket.on('forward to room',(path)=>{
	console.log('move to path:',path)
	window.location.href=path
})
