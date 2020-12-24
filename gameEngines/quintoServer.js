try{
	console.log('started Quinto')	
	process.on('message', MessageIn);
	var shared = require('../htmlQuinto/js/shared.js'); //get shared functions
	function updateUser(playerID,command,data){
		process.send({playerID:playerID,command:command,data:data})
	}
	function updateALLUsers(userList){
		process.send({playerID:'all',command:'userList',data:userList})
	}
	function messageOut(ID, message, color="#ffff00"){
		var messageObj = {
			data: "" + message,
			color: color
		};
		process.send({playerID:ID,command:'message',data:JSON.stringify(messageObj)});
	}
}
catch(err){
	console.log('browser method')
	function updateUser(playerID,command,data){
		console.log('playerID:',playerID,'command:',command,'data:',data)
	}
	function updateALLUsers(userList){
		console.log('all','userList',userList)
	}
	function messageOut(ID, message, color="#ffff00"){
		var messageObj = {
			data: "" + message,
			color: color
		};
		console.log(ID,'message',messageObj);
	}
	//var '{quinto}'='rageServer'
}

function senderror(ID,error){
	messageOut(ID,error,"#ff0000")
}
function MessageIn(message2server){
	if('command' in message2server){
		let playerID=message2server.ID
		let command=message2server.command
		let data=message2server.data
		console.log('{quinto}44',playerID,'command:',command,'data:',data);
		let playerIndex=players.map(player=>player.ID).indexOf(playerID)
		if(playerIndex!=-1){
			console.log('{Quinto}47 playerIndex',playerIndex)
			switch(command){
				case 'addPlayer':getPrivData(players[playerIndex]); break;
				case 'removePlayer':removePlayer(playerIndex); break;
				case 'userName':renameUser(players[playerIndex],data)
				case 'ready':ready(players[playerIndex]); break;
				case 'newBoardState':newBoardState(players[playerIndex],data); break;
				case 'end':gameEnd();break;
				//case 'startGame':startGame(); break;
			}
		}else{
			console.log('gameStatus',gameStatus)
			if(command=='addPlayer' && gameStatus==gameMode['LOBBY']){
				console.log('adding player')
				addPlayer(playerID,data)
			}else if(command=='end'&&gameStatus==gameMode.LOBBY){return process.exit(0)}
			else{
				updateBoard(playerID, readyTitleColor, true)
				updateUser(playerID,"allTiles", allTiles);
				updateUser(playerID,'boardState', boardState);
				updateALLUsers(userList)
			}
		}
	}else if('debug' in message2server){
		try{
			eval("console.log("+message2server.input+")");
		} catch (err) {
			console.log("invalid command in pit");
		}
	}else{console.log('no command')}
	//console.log('end of message in')
}
//TODO: be able to turn in tiles and get new ones



var minPlayers = 2;
var maxPlayers = 20;

var players = [];
var spectators = [];

var currentTurn = 0;

var boardRows = 13;
var boardColumns = 17;
var boardState = [];

var tileDesc = {
    zeros: 7,
	ones: 6,
	twos: 6,
	threes: 7,
	fours: 10,
	fives: 6,
	sixes: 10,
	sevens: 14,
	eights: 12,
	nines: 12
};

var tiles = [];
var allTiles = [];

var gameMode = {
    LOBBY: 0,
    PLAY: 1,
    END: 2
};

var playerStatus = {
	PLAYER: 0,
	SPECTATOR: 1
}

var gameStatus = gameMode.LOBBY;

var serverColor = "#ffff00";
var gameColor = "#00ff00";
var gameErrorColor = "#ff0000";
var chatColor = "#ffffff";
var readyColor = "#ffffff";
var notReadyColor = "#ff0000";
var readyTitleColor = "#00ff00";
var notReadyTitleColor = "#ff0000";
var spectatorColor = "#444444";
var notYourTurnColor = "#ffffff";
var yourTurnColor = "#0000ff";
var userList=[]


console.log("Server Started!");

function defaultUserData(){
	return {
		userName: "Unknown",
		tiles: [],
		score: 0,
		statusColor: notReadyColor,
		ready: false,
		skippedTurn: false
	}
}
function addPlayer(playerID,userName){
    /*Associating the callback function to be executed when client visits the page and
      websocket connection is made */
	let player = defaultUserData();
	player.ID=playerID
	player.userName=userName
	
    if (gameStatus === gameMode.LOBBY) {
        player.statusColor = notReadyColor;
	}
	
    var message_to_client = {
        data:"Connection established!",
        color: serverColor
    };
	
    messageOut(playerID,"Connection established!");
	players.push(player)
    /*sending data to the client , this triggers a message event at the client side */
    console.log( "Socket.io Connection with client " + playerID +" established");	
	updateUsers()
}
function getPrivData(player){
        updateBoard(player.ID, notReadyTitleColor, true);
		updateUser(player.ID,"allTiles", allTiles);
		updateUser(player.ID,'boardState', boardState);
		updateUser(player.ID,'tiles', player.tiles);
		updateTurnColor();
}
function removePlayer(playerIndex){
	players.splice(playerIndex,1)
	console.log('player left',players)
	if(players.length<minPlayers){gameEnd()};
	updateUsers()
}
function renameUser(player,userName) {  
	player.userName = userName;
	//player.ready = false;
	//console.log('{quinto}',"added new user: " + player.userName);
	//messageOut('all', "" + player.userName + " has changed name to", serverColor);
	updateUsers();
};
function ready(player) {
	if (gameStatus === gameMode.LOBBY){
		player.ready=player.ready^true
		if (player.ready == true) {
			player.statusColor = readyColor;
			updateBoard(player.ID, readyTitleColor , false);
		} else {
			//var i = players.indexOf(player);
			player.statusColor = notReadyColor;
			updateBoard(player.ID, notReadyTitleColor , false);
		}
		checkStart();
		console.log("{rage}" + player.userName + " is ready: " + player.ready==true);
		updateUsers();
	}
}
	
function newBoardState(player,newBoardState){
	if (gameStatus === gameMode.PLAY){
		if( players[currentTurn%players.length].id === player.id ){
			check = shared.validTilesToPlay(player.tiles, newBoardState, boardState, allTiles);
			if(check.error.length == 0){
				if(check.skipped){
					player.skippedTurn = true;
				} else {
					player.skippedTurn = false;
				}
				player.score += check.score;
				//console.log('{quinto}', "before remove", player.tiles);
				for(var i = 0; i < check.changedTiles.length; i++){ //place tiles onto board
					player.tiles.splice(player.tiles.indexOf(check.changedTiles[i]), 1);
				}
				//console.log('{quinto}', "after remove", player.tiles);
				dealTiles(player, shared.numberOfTilesForHand - player.tiles.length);
				//console.log('{quinto}', "after pick", player.tiles);
				boardState = check.boardState;
				sendBoardState();
				nextTurn();
				updateTurnColor();
			}else{
				messageOut(player.ID, check.error, gameErrorColor);
				console.log('{quinto}', "invalid play:", check.error);
				//message(player.ID, "Invalid play!", gameErrorColor);
			}
		} else {
			messageOut(player.ID, "It is not your turn!", gameErrorColor);
		}
	} else {
		messageOut(player.ID, "Game not in mode to recieve play", gameErrorColor);
	}
};

function nextTurn(){
	if(checkEnd()){
		gameEnd();
	} else {
		currentTurn = (currentTurn + 1) % players.length;
		if(players[currentTurn].tiles.length != 0){
			console.log("It is " + players[currentTurn].userName + "'s turn!")
			messageOut(players[currentTurn], "It is your turn!", gameColor);
		}else {
			players[currentTurn].skippedTurn = true;
			nextTurn();
		}
	}
}



function updateUsers(){
	console.log('{quinto}',"--------------Sending New User List--------------");
    userList = [];

	players.forEach(function(client){
		userList.push(getUserSendData(client));
	});

    console.log('{quinto}',"----------------Done Sending List----------------");
	
	updateALLUsers(userList);
}

function getUserSendData(client){
	console.log('{quinto}',"userName:", client.userName, " |ready:", client.ready, "|status:", client.statusColor, "|score:", client.score);
	return{
		id: client.ID,
		userName: client.userName,
		color: client.statusColor,
		score: client.score
	};
}

function updateBoard(socketSend, titleColor, showBoard) { //switches between title and game screen
    var showBoardMessage = {
        titleColor: titleColor,
        displayTitle: (showBoard === true) ? "none" : "flex",
        displayGame: (showBoard === true) ? "flex" : "none"
    };
    updateUser(socketSend,"showBoard", showBoardMessage);
}

function checkStart() {	
    if( gameStatus === gameMode.LOBBY) {
        var readyCount = 0;
        players.forEach(function(client) {
            if( client.ready ) {
                readyCount++;
            }
        });
		console.log('{quinto} readyCount'+readyCount)
        if(readyCount == players.length && readyCount >= minPlayers) {
            gameStart();
        }
    }
}

function gameStart() {
	console.log('{quinto}',"gameStart");
	messageOut('all', "THE GAME HAS STARTED", gameColor);
	gameStatus = gameMode.PLAY;
	//reset players
	
	spectators = [];
	players.forEach(function(client){ 
		client.statusColor = notYourTurnColor;
		client.tiles = [];
		client.score = 0;
		client.skippedTurn = false;
	});
	
	setUpBoard();
	updateBoard('all', readyTitleColor, true);
	currentTurn = Math.floor(Math.random()*players.length); //random starting person
	console.log('{quinto}','players',players)
	console.log('{quinto}',players[currentTurn%players.length].userName + " starts the game!");
	messageOut('all', players[currentTurn%players.length].userName + " starts the game!", gameColor);
	
    tiles = makeTiles(); //deck to deal to players
	//console.log('{quinto}', "cards", tiles);
	allTiles = [];
	for(var i =0; i < tiles.length; i++){
		allTiles.push(tiles[i]); //deck to reference cards
	}
	updateUser('all',"allTiles", allTiles);
	//console.log('{quinto}', "alltiles", allTiles);
	
	players.forEach(function(player) {
		//player.tiles = [];
		dealTiles(player, shared.numberOfTilesForHand);
		//console.log('{quinto}', "player", player.name,player.tiles);
	});
	
	//console.log('{quinto}', "cards", tiles);
	//console.log('{quinto}', "allTiles", allTiles);

	updateTurnColor();
	//wait for turn plays
}

function setUpBoard(){ //set all positions on the board to -1 to indicate no tile
	var row;
	var column;
	boardState = [];
	var boardRow;
	for (row = 0; row < boardRows; row++){
		boardRow = [];
		for (column = 0; column < boardColumns; column++){
			boardRow.push(shared.blankTile);
		}
		boardState.push(boardRow);
	}
	sendBoardState();
}

function sendBoardState(){
	updateUser('all',"boardState", boardState);
}

function makeTiles() {
    var cards = [];
	var i;
	var tileId = 0;

	for (i = 0; i < tileDesc.zeros; i+=1) {
        cards.push({owner: "deck", number: 0, id: tileId++});
    }
    for (i = 0; i < tileDesc.ones; i+=1) {
        cards.push({owner: "deck", number: 1, id: tileId++});
    }
	for (i = 0; i < tileDesc.twos; i+=1) {
        cards.push({owner: "deck", number: 2, id: tileId++});
    }
	for (i = 0; i < tileDesc.threes; i+=1) {
        cards.push({owner: "deck", number: 3, id: tileId++});
    }
	for (i = 0; i < tileDesc.fours; i+=1) {
        cards.push({owner: "deck", number: 4, id: tileId++});
    }
	for (i = 0; i < tileDesc.fives; i+=1) {
        cards.push({owner: "deck", number: 5, id: tileId++});
    }
	for (i = 0; i < tileDesc.sixes; i+=1) {
        cards.push({owner: "deck", number: 6, id: tileId++});
    }
	for (i = 0; i < tileDesc.sevens; i+=1) {
        cards.push({owner: "deck", number: 7, id: tileId++});
    }
	for (i = 0; i < tileDesc.eights; i+=1) {
        cards.push({owner: "deck", number: 8, id: tileId++});
    }
	for (i = 0; i < tileDesc.nines; i+=1) {
        cards.push({owner: "deck", number: 9, id: tileId++});
    }
    return cards;
}

function dealTiles(player, amountToBeDelt) {
	var tileToGive;
	var i;
	for( i = 0; i < amountToBeDelt; i+=1) {
		if(tiles.length > 0){
			tileToGive = chooseRandomTile();
			tileToGive.owner = player.id;
			player.tiles.push(tileToGive);
		}
	}
	updateUser(player.ID,"tiles", player.tiles);
	messageOut('all', tiles.length + " tiles left", gameColor);
}

function chooseRandomTile() {
	if(tiles.length > 0){
		var index = Math.floor(Math.random() * tiles.length);
		var returnTile = tiles[index];
		tiles.splice(index, 1);
		return returnTile;
	}
}
/*
function returnTileToDeck(player, tile, tileDeck) {
	var tileIndex = player.tiles.indexOf(tile);
	if (tileIndex >= 0){
		player.tiles.splice(tileIndex, 1);
		tileDeck.push(tile);
		player.emit("tiles", player.tiles);
		return true;
	} else{
		console.log('{quinto}', "tile not found!")
		player.emit("tiles", player.tiles);
		return false;
	}
}*/

function playersHaveTiles(){ //to check end conditions
	var i;
	var have = false;
	for(i=0; i<players.length; i += 1){
		if(players[i].tiles.length > 0){
			have = true;
		}
	}
	return have;
}

function allSkipped(){
	var allSkipped = true; //check if everyone has skipped
	for(var i = 0; i < players.length; i++){
		if(!players[i].skippedTurn){
			allSkipped = false;
		}
	}
	return allSkipped;
}

function checkEnd(){
	return (!playersHaveTiles() || allSkipped());
}

function gameEnd() {
    console.log('{quinto}',"gameEnd");
    updateBoard('all', notReadyTitleColor, false);

	messageOut('all', "THE GAME HAS ENDED", gameColor);
	messageOut('all', "Scores: ", gameColor);
	let total = 0;
	for( var i = 0; i < players.length; i += 1){
		for(var tile = 0; tile < players[i].tiles.length; tile++){
			players[i].score -= players[i].tiles[tile].number;
		}
		messageOut('all', players[i].userName + ": " + players[i].score + "\n", gameColor);
		total += players[i].score;
	}
	messageOut('all', "Total score: " + total, gameColor);
	
    players = [];
	spectators = [];
    players.forEach(function(client) {
        client.ready = false;
        client.statusColor = notReadyColor;
    });
    gameStatus = gameMode.LOBBY;
    updateUsers();
}

function updateTurnColor(){
	if(players.length > 0){
		players.forEach(function(player){
			player.statusColor = notYourTurnColor;
		});
		players[currentTurn%players.length].statusColor = yourTurnColor;
		console.log('{quinto}','update turn color');
		updateUsers();
	}
}

