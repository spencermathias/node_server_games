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
		dataFromServer.push({playerID:playerID,command:command,data:data})
	}
	function updateALLUsers(userList){
		console.log('all','userList',userList)
		dataFromServer.push({playerID:'all',command:'userList',data:userList})
	}
	function messageOut(ID, message, color="#ffff00"){
		var messageObj = {
			data: "" + message,
			color: color
		};
		console.log(ID,'message',messageObj);
		tempFunctions.message(JSON.stringify(messageObj))
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
			console.log('{racko}47 playerIndex',playerIndex)
			switch(command){
				case 'addPlayer':getPrivData(players[playerIndex]); break;
				case 'removePlayer':removePlayer(playerID); break;
				case 'userName':renameUser(players[playerIndex],data)
				case 'ready':ready(players[playerIndex]); break;
				case 'submit pushed':checkWin(players[playerIndex]); break;
				case 'switch with deck':switchWithDeck(players[playerIndex],data);break
				case 'get from face down': getFaceDown(players[playerIndex]);break
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
				//updateUser(playerID,"allTiles", allTiles);
				//updateUser(playerID,'boardState', boardState);
				updateALLUsers(userList)
			}
		}
	}else if('debug' in message2server){
		try{
			eval("console.log("+message2server.input+")");
		} catch (err) {
			console.log("invalid command in racko");
		}
	}else{console.log('no command')}
	//console.log('end of message in')
}

var minPlayers = 2;
var maxPlayers = 30
var cardOnTop = [];
var cardsInFaceUpPile = [];
var cardPlayedOnTopOf = [];
var pile = [];
var pilesForGame = [];
var pilesNeeded = 0;
var winScore = 500

var players = [];
var userList=[]


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
var currentTurn = 0;

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
//functions called from messageIn function
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
    //sending data to the client , this triggers a message event at the client side 
    console.log( "Socket.io Connection with client " + playerID +" established");	
	updateUsers()
}
function getPrivData(player){
        updateBoard(player.ID, player.ready, gameStatus!=gameMode['LOBBY']);
		//updateUser(player.ID,"allTiles", allTiles);
		//updateUser(player.ID,'boardState', boardState);
		updateUser(player.ID,'cards', player.tiles);
		
		updateTurnColor();
		messageOut('all',player.userName+' has returned',serverColor)
}
function removePlayer(playerID){
	let playerIndex=players.map(player=>player.ID).indexOf(playerID)
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
		console.log("{racko}" + player.userName + " is ready: " + player.ready==true);
		updateUsers();
	}
}
function checkWin(player){
	if(players[currentTurn].ID == player.ID){
		var tilesCorect = 0;
		//console.log(__line,player);
		let playersTiles = player.tiles;
		direction = Math.sign(playersTiles[1].number-playersTiles[0].number)
		//console.log(__line, direction)
		for(var i = 0; i < playersTiles.length - 1;i++){
			//console.log(__line,playersTiles[i].number*direction,playersTiles[i + 1].number*direction)
			if(playersTiles[i].number*direction < playersTiles[i + 1].number*direction){
				tilesCorect++;
			}else{
				senderror(player.ID,"your tiles arn't in order, to win the game all your tiles must be in order from least to gratest");
				break;
			}
		}
		var runs = 0;

		if(tilesCorect == playersTiles.length - 1){
			for(let a = 0;a < playersTiles.length - 2;a++){
				if(playersTiles[a].number + 1*direction == playersTiles[a + 1].number){
					if(playersTiles[a].number + 2*direction == playersTiles[a + 2].number){
						runs++;
					}
				}
			}
			
			//console.log(__line,runs)
			
			if(runs > 0){
				messageOut('all','The winner is ' + player.userName +'!',gameColor)
				player.score+=25
				let maxScore=countPoints()
				if (maxScore>winScore){
					gameEnd();
				}else{
					startRound()
				}
			}else{
				senderror(player.ID,'To win the round you must have at least one run of 3');
			}
		}
	}else{
		senderror(player.ID,'you must press the submit button at the begenning of your turn');
	}
}
function switchWithDeck(player,card){
	if(players[currentTurn].ID == player.ID){
		let cardIndex = undefined;
		//console.log(card);
		//console.log(__line,cardsInFaceUpPile[0]);
		for(let y = 0;y < player.tiles.length;y++){
			if(player.tiles[y].number == card.text){
				if(player.tiles[y].originalPile == card.originalPile){
					cardIndex = y;
					break
				}
			}
		}
		if(cardIndex!=undefined){
			let x = player.tiles[cardIndex];
			console.log(x);
			player.tiles.splice(cardIndex,1,cardsInFaceUpPile.shift());
			cardsInFaceUpPile.unshift(x);
			nextTurn();
			updateUser('all','centerCard',cardsInFaceUpPile[0]);
			updateUser(player.ID,'cards',player.tiles)
			//console.log('you clicked the tile');
		}else{
			if(player.alreadyPicked){
				if(card.originalPile == cardsInFaceUpPile[0].originalPile && card.text == cardsInFaceUpPile[0].number){
					nextTurn();
					updateUser('all','centerCard',cardsInFaceUpPile[0]);
				}else{
					senderror(player.ID,'card not in your hand')
					updateUser(player.ID,'cards',player.tiles)
				}
			}else{
				senderror(player.ID,'card not in your hand')
				updateUser(player.ID,'cards',player.tiles)
			}
		}
	}else{
		senderror(player.ID,'its not your turn');
	}
}
function getFaceDown(player){
	if(player.alreadyPicked){
		senderror(player.ID,'you have already taken a face down card');
	}else{
		player.alreadyPicked = true;
		//TODO: show the face down card
		
		if( players[currentTurn%players.length].ID === player.ID ){
			cardsInFaceUpPile.unshift(dealSingleTile());
			updateUser(player.ID,'centerCard',cardsInFaceUpPile[0]);
			//console.log('switched the cards',pilesForGame[pileOn],cardsInFaceUpPile);
		}
	}
}

function gameEnd() {
    //console.log(__line,"gameEnd");
    updateBoard('all', notReadyTitleColor, false);
	
	messageOut('all', "THE GAME HAS ENDED", gameColor);
	messageOut('all', "Scores: ", gameColor);
	let total = 0;
	for( var i = 0; i < players.length; i += 1){
		messageOut('all', players[i].userName + ": " + players[i].score + "\n", gameColor);
		total += players[i].score;
	}
	messageOut('all', "Total score: " + total, gameColor);
	
	
	
    players = [];
	spectators = [];
	pilesForGame=[];
	cardsInFaceUpPile=[];
    gameStatus = gameMode.LOBBY;
    updateUsers();
}

function countPoints(){
	let maxScore=0
	for(j=0;j<players.length;j++){
		var tilesCorect = 1;
		//console.log(__line,player);
		let playersTiles = players[j].tiles;
		direction = Math.sign(playersTiles[1].number-playersTiles[0].number)
		//console.log(__line, direction)
		for(var i = 0; i < playersTiles.length - 1;i++){
			//console.log(__line,playersTiles[i].number*direction,playersTiles[i + 1].number*direction)
			if(playersTiles[i].number*direction < playersTiles[i + 1].number*direction){
				tilesCorect++;
			}else{
				break;
			}
		}
		//console.log(tilesCorect)
		players[j].score+=tilesCorect*5
		var runs = 0;

		for(let a = 0;a < tilesCorect - 2;a++){
			if(playersTiles[a].number + 1*direction == playersTiles[a + 1].number){
				if(playersTiles[a].number + 2*direction == playersTiles[a + 2].number){
					runs++;
				}
			}
		}
		//console.log(runs)
		if(runs){
			players[j].score+=Math.pow(2,runs)*25
		}
		maxScore=Math.max(maxScore,players[j].score)
	}
	return maxScore
}
//comunication functions
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
		score:client.score,
		color: client.statusColor,
	};
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
//functions called to make game play
function checkStart() {	
    if(gameStatus === gameMode.LOBBY) {
        var readyCount = 0;
        players.forEach(function(player) {
            if( player.ready ) {
                readyCount++;
            }
        });
        if((readyCount == players.length && readyCount >= minPlayers)||readyCount == maxPlayers) {
            gameStart();
        }
    }
}
function gameStart() {
	console.log('{racko}',"gameStart");
	messageOut('all', "THE GAME HAS STARTED", gameColor);
	gameStatus = gameMode.PLAY;
	//reset players
	//players = [];
	//spectators = [];
	

	currentTurn = Math.floor(Math.random()*players.length); //random starting person
	players.forEach(function(player){
		if(!player.ready){
			removePlayer(player.ID)
		}
	});
	
	pilesNeeded = Math.ceil(((players.length * 10) + 2)/60);
	pushPilesNeeded(pilesNeeded);
	
	//console.log(__line,pilesNeeded);
	
	updateBoard('all', readyTitleColor, true);
	startRound()
	

	
}
function startRound(){
	pilesForGame=[]
	pilesNeeded = Math.ceil(((players.length * 10) + 2)/60);
	pushPilesNeeded(pilesNeeded);
	cardsInFaceUpPile.push(dealSingleTile());
	players.forEach(function (player){
		player.tiles=[]
		dealTiles(player,10);
		updateUser(player.ID,'cards',player.tiles);
	});
	updateUser('all','centerCard',cardsInFaceUpPile[0])
	
	updateUsers();
	//wait for turn plays
	nextTurn()
}
function pushPilesNeeded(numPiles){
	let pile=[]
	for(var i = 0;i < numPiles;i++){
		for(let number=1;number<61;number++){
			pile.push({number:number,originalPile:i})
		}
		pilesForGame.push(pile)
	}
}
function updateBoard(socketSend, titleColor, showBoard) { //switches between title and game screen
    var showBoardMessage = {
        titleColor: titleColor,
        displayTitle: (showBoard === true) ? "none" : "flex",
        displayGame: (showBoard === true) ? "flex" : "none"
    };
    updateUser(socketSend,"showBoard", showBoardMessage);
}
function dealTiles(player, amountToBeDelt) {
	var i;
	for( i = 0; i < amountToBeDelt; i+=1) {
		player.tiles.push(dealSingleTile());
	}
}
function dealSingleTile(){
	let pileToTakeFrom = findPileToPickFrom();
	x = Math.floor(Math.random() * pilesForGame[pileToTakeFrom].length);
	return pilesForGame[pileToTakeFrom].splice(x,1).pop();
}
function findPileToPickFrom(){
	var posiblePiles = [];
	for(let y = 0;y < pilesForGame.length;y++){
		if(pilesForGame[y].length != 0){
			posiblePiles.push(y);
		}
		//console.log('{racko}',pilesForGame[y]);
	}
	console.log('{racko}',posiblePiles);
	if(posiblePiles.length == 0){
		return reShuffle(cardsInFaceUpPile);
	}else{
		let x = Math.floor(Math.random() * posiblePiles.length);
		//console.log(__line,posiblePiles)
		return posiblePiles[x];
	}
}
function reShuffle(cardsInFaceUpPile){
	while(cardsInFaceUpPile.length > 0){
		let y = cardsInFaceUpPile[0];
		cardsInFaceUpPile.splice(0,1);
		pilesForGame[y.originalPile].push(y);
		
	}
	
	var posiblePiles = [];
	for(let y = 0;y < pilesForGame.length;y++){
		if(pilesForGame[y].lenth != 0){
			posiblePiles.push(y);
		}
	}
	let x = Math.floor(Math.random() * posiblePiles.length);
	//console.log(__line,posiblePiles)
	return posiblePiles[x];
}
function nextTurn(){
	players[currentTurn].alreadyPicked = false;
	currentTurn = (currentTurn + 1) % players.length;
	console.log("It is " + players[currentTurn].userName + "'s turn!");
	//messageOut(players[currentTurn], "It is your turn!", gameColor);
	updateTurnColor();
	updateUsers();
}





























