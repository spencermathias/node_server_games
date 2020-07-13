//subtract tiles at end
//TODO: be able to turn in tiles and get new ones
//TODO: send current board state to new connections
//subtract remaining tiles
//TODO: deal cards on game restart
/*initializing the websockets communication , server instance has to be sent as the argument */

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
	let playerID=message2server.ID
	let command=message2server.command
	let data=message2server.data
	console.log('{rage}44',playerID,'command:',command,'data:',data);
	let playerIndex=players.map(player=>player.ID).indexOf(playerID)
	if(playerIndex!=-1){
		console.log('{Quinto}47 playerIndex',playerIndex)
		switch(command){
			case 'addPlayer':getPrivData(players[playerIndex]); break;
			case 'removePlayer':removePlayer(playerIndex); break;
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
			updateUser(playerID,"allTiles", allTiles);
			updateUser(playerID,'boardState', boardState);
			updateALLUsers(userList)
		}
	}
	//console.log('end of message in')
}

var minPlayers = 2;
var maxPlayers = 20;

var allClients = [];
var players = [];
var spectators = [];

var winScore = 250;

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
//var yourTurnColor = "#0000ff";


console.log("Server Started!");

function defaultUserData(){
	return {
		ID: "Unknown",
		tiles: [],
		score: 0,
		statusColor: notReadyColor,
		ready: false,
		trades:[],
		bids:[],
		incomingTrades:[]
	}
}

function addPlayer(playerID){
    /*Associating the callback function to be executed when client visits the page and
      websocket connection is made */
	let player = defaultUserData();
	player.ID=playerID
	
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
function removePlayer(playerIndex){
	players.splice(playerIndex,1)
	console.log('player left',players)
	if(players.length<minPlayers){gameEnd()};
	updateUsers()
}
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
		console.log("{pit}" + player.ID + " is ready: " + player.ready==true);
		updateUsers();
	}
}
var stolenCard = {message:"You don't own that card!"}

io.sockets.on("connection", function(socket) {
    socket.userData = defaultUserData();

    allClients.push(socket);
    if (gameStatus === gameMode.LOBBY) {
        socket.userData.statusColor = notReadyColor;
    } else {
		spectators.push(socket);
        socket.userData.statusColor = spectatorColor;
        updateBoard(socket, notReadyTitleColor, true);
		updateUsers(socket);
    }

	message(socket, "Connection established!", serverColor)

    console.log(__line, "Socket.io Connection with client " + socket.id +" established");

	
	
	//happens when a player starts a bid  (changes right hand side)
	socket.on('submitedBidTiles',function(tileNumbers){
		//makes sure people actily have those cards
		if (checkCardOwner(socket,tileNumbers)!= undefined){
			socket.userData.bids.push(tileNumbers);
			updateUsers();
		}
	});
	
	//happens when a player answers another players bid (changes left hand side)
	socket.on('attemptTrade',function(tileNumbers, toPlayerNumber){
		if((toPlayerNumber >=0)&&(toPlayerNumber<players.length)){
			if (checkCardOwner(socket,tileNumbers)!= undefined){
				
				console.log(__line,"before matrix");
				printMatrix();
				
				//the player number of the socket (person attempting the trade
				fromPlayerNumber = players.indexOf(socket);
				if (fromPlayerNumber >= 0){
					playerTradeMatrix[toPlayerNumber][fromPlayerNumber].push(tileNumbers);
				}
				
				console.log(__line,"after matrix");
				printMatrix();
				
				//console.log(__line,'toPlayerNumber',toPlayerNumber,players[toPlayerNumber].ID);
				players[toPlayerNumber].emit('tradeMatrix',playerTradeMatrix[toPlayerNumber]);
				//console.log(__line,playerTradeMatrix);
			}
		} else {
			console.log(__line,"invalid player number for trade!!!!!!!");
		}
	});
	
	//happens when original player accepts answer (changes both sides)
	socket.on('tradeReady',function(userNumber,placeNumber){
		if((userNumber >=0)&&(userNumber < players.length)){
			
			console.log(__line,"before matrix");
			printMatrix();
			
			let fromPlayerNumber = players.indexOf(socket);
			let fromPlayer = socket;
			let toPlayer = players[userNumber];
			
			let trade = playerTradeMatrix[fromPlayerNumber][userNumber].pop(); //TODO: make random?? also might get lost if trade response fails
			
			console.log(__line,"after matrix");
			printMatrix();
			
			if(trade != undefined){
				console.log(__line,'popped trade fromPlayerNumber',trade,fromPlayerNumber);
				//let length = trade.length - 1;
				//console.log(__line,'length',length);
				//console.log(__line,'toPlayer',toPlayer.ID);
				//console.log(__line,'fromPlayer.userData.bids',fromPlayer.userData.bids);
				
				//Get from bid array
				let tradeResopnseNum = -1;
				for (let r = 0;r < fromPlayer.userData.bids.length;r++){
					if (fromPlayer.userData.bids[r].length == trade.length){
						tradeResopnseNum = r;
						break;
					}
				}
				if (tradeResopnseNum >= 0){
					let tradeResponse = fromPlayer.userData.bids.splice(tradeResopnseNum,1)[0];
					
					//print the trades
					var out = "" + tradeResponse + " from " + fromPlayer.ID + "'s bid array    " + trade + " from " + players[userNumber].ID + "'s matrix";
					
					console.log(__line,out);
					//console.log(__line,'trade',trade);
					//console.log(__line,'tradeResponse',tradeResponse);
					
					
					//for all cards being traded,
					for(var i = 0; i< tradeResponse.length; i++){
						var cardID1 = tradeResponse[i];
						
						//destroy invalid bids for player 1 (from player)
						for(var j = fromPlayer.userData.bids.length-1; j >= 0 ; j--){
							var bid = fromPlayer.userData.bids[j];
							for(var k = 0; k<bid.length; k++){
								if(cardID1 == bid[k]){ // if a bid has a card that is about to be traded, delete the bid
									fromPlayer.userData.bids.splice(j,1);
									break;
								}	
							}
						}
						
						//destroy invalid bids for player 2 (toPlayer)
						var cardID2 = trade[i]
						for(var j = toPlayer.userData.bids.length-1; j >= 0 ; j--){
							var bid = toPlayer.userData.bids[j];
							for(var k = 0; k<bid.length; k++){
								if(cardID2 == bid[k]){ // if a bid has a card that is about to be traded, delete the bid
									toPlayer.userData.bids.splice(j,1);
									break;
								}	
							}
						}
						
						//destroy all invalid trades in the trade matrix  (could be optimized)
						
						for(var l=0; l<players.length; l++){
							for(var m=0; m<players.length; m++){
								var tradeArray = playerTradeMatrix[l][m];
								for(var j = tradeArray.length-1; j >= 0 ; j--){
									var bid = tradeArray[j];
									for(var k = 0; k<bid.length; k++){
										if((cardID1 == bid[k])||(cardID2==bid[k])){ // if a bid has a card that is about to be traded, delete the bid
											tradeArray.splice(j,1);
											break;
										}	
									}
								}
							}
						}
					}
					
					
					console.log(__line, "After deleting from trade Matrix");
					printMatrix();
					
					//swap cards in trade

					for (var x = 0;x < tradeResponse.length;x++){
						//get tile
						let tileNumber = toPlayer.userData.tiles.indexOf(trade[x]);
						//store tile
						let temp = toPlayer.userData.tiles[tileNumber];
						//swap
						toPlayer.userData.tiles[tileNumber] = tradeResponse[x];
						tileNumber = socket.userData.tiles.indexOf(tradeResponse[x]);
						socket.userData.tiles[tileNumber] = temp;
					}
					
					//send bids to all
					updateUsers();
					//send new tiles and trade matrix to users
					sendTilesToPlayer(socket);
					sendTilesToPlayer(toPlayer);
					toPlayer.emit('tradeMatrix',playerTradeMatrix[userNumber]);
					socket.emit('tradeMatrix',playerTradeMatrix[fromPlayerNumber]);
					
					// send trade message to user
					specialMessage(toPlayer.ID,'Traded with ',socket.ID,gameColor);
					specialMessage(socket.ID,'Traded with ',toPlayer.ID,gameColor);
				} else {
					console.log("No valid matching bids !!!!!");
				}
			} else {
				console.log("No trades left in player trade matrix !!!!!!");
			}
		} else {
			console.log("invalid user number !!!!!!!!");
		}
	});
	
	socket.on('cheakEndOfRound',function(){
		var add = checkWin(socket.userData.tiles);
		console.log(__line,'check end of round for ', socket.ID,socket.userData.tiles);
		if(add!= 0){
			newRound(socket,add);
		}
	});
});

function printMatrix(){
	var pad = 30;
	var namePad=10; //min 3
	
	//first column is names
	playerList = "1\\2".padStart(namePad);
	for(var i = 0; i< players.length;i++){
		playerList += players[i].userData.userName.padStart(pad);	
	}
	
	console.log(playerList);
	
	for(var i = 0; i< players.length;i++){
		//name column
		var out = "";
		var name = "" + players[i].userData.userName;
		out += name.padStart(namePad);
		
		
		for(var j=0; j<playerTradeMatrix[i].length; j++){
			var arr = "";
			for(var k=0; k<playerTradeMatrix[i][j].length; k++){
				arr+='[';
				arr += playerTradeMatrix[i][j][k];
				arr += ']'
			}
			arr+='|';
			
			out += arr.padStart(pad);
		}
		console.log(out);
		
	}
}


function newRound(socket,add){
	console.log(__line,'user check',socket !== undefined);
	if (socket !== undefined){ 
		specialMessage(io.sockets,'this round was won by', socket.ID,gameColor);
		socket.userData.score += add;
		updateUsers();
		if (socket.userData.score >= winScore){
			return gameEnd(socket);
		}
	}
	playerTradeMatrix = [];
	message(io.sockets, "A NEW ROUND HAS STARTED", gameColor);
	
	//clear trades and bids
	players.forEach(function(player){
		player.userData.trades = [];
		player.userData.tiles = [];
		player.userData.bids = [];
		player.userData.incomingTrades = [];
		players.forEach(function (p){player.userData.incomingTrades.push(new Array())});
		playerTradeMatrix.push(player.userData.incomingTrades);
		
		player.emit('tradeMatrix',player.userData.incomingTrades);
	});
	
	updateBoard(io.sockets, readyTitleColor, true);
	console.log(__line,'p',players.length);
	
	//deal new cards
	shared.cardDes.products = shared.cardDes.products.slice(0,players.length);
	tiles = new Deck( shared.cardDes); //deck to deal to players
	var pile = new Array(tiles.totalCards);
	for (var i = 0; i < pile.length; i++){ pile[i]=i;}
	
	//print all tiles
	for (var i = 0; i < pile.length; i++){
		console.log(__line,'cards',pile[i],tiles.getProperties(pile[i]));
	}
	
	//console.log(__line, "cards", pile) ;
	//console.log(__line, "cards", tiles);
	dealAllTiles(players,pile);
	sendTilesToAllPlayers(players);
	//console.log(__line, "cards", tiles);
	//console.log(__line, "allTiles", allTiles);
	updateUsers();
}

function checkWin(tilesToCheak){
	deck = new Deck( shared.cardDes);
	cardCount = {};
	shared.cardDes.products.forEach((i)=>{
		cardCount[i.name] = {card:i,count:0};
	});
	
	tilesToCheak.forEach((i)=>{
		var cardProp = deck.getProperties(i);
		console.log(__line,i,cardProp);
		if (cardProp.products != undefined){
			cardCount[cardProp.products.name].count++;
		}
	});
	console.log(__line,'cardCount',cardCount);
	var add = 0;
	Object.keys(cardCount).forEach((i)=>{
		//console.log(__line,cardCount[i]);
		//console.log(__line,cardCount[i].count);
		if (cardCount[i].count>=9){
			//console.log(__line,'should be in there',cardCount[i].card.value);
			add = cardCount[i].card.value;
		}
	});
	return add;
}

function checkCardOwner(socket,tileNumbers){
	try{
		tileNumbers.forEach((t)=>{
			//console.log(__line,t);
			if(socket.userData.tiles.indexOf(t)<0){
				throw stolenCard;             
			}
		});
		return tileNumbers;
	}catch(e){
		if(e == stolenCard){
			message(socket,e.message,gameErrorColor);
			console.warn(__line, e.message);
		}else throw e;
	}
	return undefined;
}

function message(socket, message, color){
	var messageObj = {
		data: "" + message,
		color: color
	};
	socket.emit('message',JSON.stringify(messageObj));
}

function updateUsers(target = io.sockets){
	console.log(__line,"--------------Sending New User List--------------");
    var userList = [];
	if(gameStatus == gameMode.LOBBY){
		allClients.forEach(function(client){
			userList.push(getUserSendData(client));
		});
	} else {
		players.forEach(function(client){
			userList.push(getUserSendData(client));
		});
		spectators.forEach(function(client){
			userList.push(getUserSendData(client));
		});
	}
    console.log(__line,"----------------Done Sending List----------------");
	
	io.sockets.emit('userList', userList);
}

function getUserSendData(client){
	console.log(__line,"ID:", client.userData.ID, " |ready:", client.userData.ready, "|status:", client.userData.statusColor, "|score:", client.userData.score);
	let bids = [0,0,0,0];
	client.userData.bids.forEach((b)=>{
		bids[b.length-1]++;
	});
	let trades = [0,0,0,0];
	client.userData.trades.forEach((b)=>{
		trades[b.length-1]++;
	});
	return{
		id: client.id,
		color: client.userData.statusColor,
		score: client.userData.score,
		ready: client.userData.ready,
		incomingTrades: client.userData.incomingTrades,
		bids,trades
	};
}

function updateBoard(socketSend, titleColor, showBoard) { //switches between title and game screen
    var showBoardMessage = {
        titleColor: titleColor,
        displayTitle: (showBoard === true) ? "none" : "flex",
        displayGame: (showBoard === true) ? "flex" : "none"
    };
    socketSend.emit("showBoard", showBoardMessage);
}

function checkStart() {	
    if( gameStatus === gameMode.LOBBY) {
        var readyCount = 0;
        allClients.forEach(function(client) {
            if( client.userData.ready ) {
                readyCount++;
            }
        });
        if(readyCount == allClients.length && readyCount >= minPlayers) {
            gameStart();
        }
    }
}

var playerTradeMatrix = [];

function gameStart() {
	console.log(__line,"gameStart");
	message(io.sockets, "THE GAME HAS STARTED", gameColor);
	gameStatus = gameMode.PLAY;
	//reset players
	players = [];
	spectators = [];
	allClients.forEach(function(client){ 
		if(client.userData.ready){
			client.userData.statusColor = notYourTurnColor;
			client.userData.tiles = [];
			client.userData.score = 0;
			client.userData.skippedTurn = false;
			players.push(client);
		} else {
			client.userData.statusColor = spectatorColor;
		}
	});
	newRound(undefined,undefined);

	//wait for turn plays
	io.emit('startGame');
}

function sendBoardState(){
	io.sockets.emit("boardState", boardState);
}


function dealAllTiles(players,carddeck){
	if (players.length > 0){
		var p = 0;
		while(carddeck.length > 0){
			dealSingleTile(players[p],carddeck);
			p = (p+1) % players.length;
		}
	} else {
		console.warn(__line,' No cards delt because there are no players');
	}
}

//deals a set nuber of tiles to a players
function dealTiles(player, carddeck, amountToBeDelt) {
	var tileToGive;
	var i;
	for( i = 0; i < amountToBeDelt; i+=1) {
		dealSingleTile(player, carddeck);
	}
}

//deals a single tile
function dealSingleTile(player,carddeck){
	if(carddeck.length > 0){
		tileToGive = chooseRandomTile(carddeck);
		//tileToGive.owner = player.id;
		player.userData.tiles.push(tileToGive);
	}
}

//removes a element from deck array and gives it to the players user data array
function chooseRandomTile(carddeck) {
	if(carddeck.length > 0){
		var index = Math.floor(Math.random() * carddeck.length);
		var returnTile = carddeck[index];
		carddeck.splice(index, 1);
		return returnTile;
	}
}

//updates all players cards
function sendTilesToAllPlayers(players){
	for (var u = 0;u < players.length; u++){
		sendTilesToPlayer(players[u]);
	}
}

//updates a single players cards
function sendTilesToPlayer(player){
	if (player != undefined){
		player.emit("tiles", player.userData.tiles);
	}
}

/*
function playersHaveTiles(){ //to check end conditions
	var i;
	var have = false;
	for(i=0; i<players.length; i += 1){
		if(players[i].userData.tiles.length > 0){
			have = true;
		}
	}
	return have;
}

function allSkipped(){
	var allSkipped = true; //check if everyone has skipped
	for(var i = 0; i < players.length; i++){
		if(!players[i].userData.skippedTurn){
			allSkipped = false;
		}
	}
	return allSkipped;
}

function checkEnd(){
	return (!playersHaveTiles() || allSkipped());
}
*/

function gameEnd(winner) {
    console.log(__line,"gameEnd");
    updateBoard(io.sockets, notReadyTitleColor, false);

	message(io.sockets, "THE GAME HAS ENDED", gameColor);
	message(io.sockets, "Scores: ", gameColor);
	let total = 0;
	for( var i = 0; i < players.length; i += 1){
		message(io.sockets, players[i].userData.userName + ": " + players[i].userData.score + "\n", gameColor);
		total += players[i].userData.score;
	}
	message(io.sockets, "Total score: " + total, gameColor);
	
	if(winner != undefined){
		message(io.sockets,'The winner is ', winner.userData.userName,gameColor);
	}
	io.emit('gameEnd');
	
    players = [];
	spectators = [];
    allClients.forEach(function(client) {
		
        client.userData.ready = false;
        client.userData.statusColor = notReadyColor;
    });
    gameStatus = gameMode.LOBBY;
    updateUsers();
}

//captures stack? to find and return line number
Object.defineProperty(global, '__stack', {
  get: function(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});
//allows to print line numbers to console
Object.defineProperty(global, '__line', {
  get: function(){
    return __stack[1].getLineNumber();
  }
});

//allows input from the console
var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
	var input = d.toString().trim();
    console.log('you entered: [' + input + ']');
	try{
		eval("console.log("+input+")");
	} catch (err) {
		console.log("invalid command");
	}
  });