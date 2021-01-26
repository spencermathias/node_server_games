//TODO:
// rejoin mechanics
// crown over the leader
// fix the board stretching
// make the code more object oriented
try{
	var mysql = require('mysql');
	// DATABASE
	var con = mysql.createConnection({
	  host: "localhost",
	  user: "root",
	  password: "",
	  database: "rage"
	});

	var useDatabase = true;
	con.connect(function(err) {
	  //if (err) throw err;
	  console.warn("Error connecting to MYSQL server. Scores will not be recorded");
	  useDatabase = false;
	});
	console.log('started rage')
	console.log('deck imported')	
	process.on('message', MessageIn);
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
	var useDatabase = false;
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
	//var __line='rageServer'
}

function senderror(ID,error){
	messageOut(ID,error,"#ff0000")
}
function MessageIn(message2server){
	if('command' in message2server){
		let playerID=message2server.ID
		let command=message2server.command
		let data=message2server.data
		console.log('{rage}49',playerID,'command:',command,'data:',data);
		let playerIndex=players.map(player=>player.ID).indexOf(playerID)
		if(playerIndex!=-1){
			console.log('playerIndex',playerIndex)
			switch(command){
				case 'addPlayer':getPrivData(players[playerIndex]); break;
				case 'removePlayer':removePlayer(playerIndex); break;
				case 'userName':renameUser(players[playerIndex],data)
				case 'ready':ready(players[playerIndex]); break;
				case 'recieveBid':recieveBid(players[playerIndex],data); break;
				case 'cardSelected':cardSelected(players[playerIndex],data); break;
				case 'startGame':startGame(); break;
				case 'end':gameEnd();break;
			}
		}else{
			console.log('gameStatus',gameStatus)
			if(command=='addPlayer' && gameStatus==gameMode['LOBBY']){
				console.log('adding player')
				addPlayer(playerID,data)
			}else if(command=='end'&&gameStatus==gameMode.LOBBY){return process.exit(0)}
			else{
				let showBoardMessage = {
					titleColor: spectatorColor,
					displayTitle: (gameStatus==gameMode.LOBBY) ? "flex" : "none",
					displayGame: (gameStatus==gameMode.LOBBY) ? "none" : "flex"
				};
				updateUser(playerID,"showBoard", showBoardMessage);
				updateUser(playerID,"trumpCard", trumpCard)
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



var gameId = -1; //game id for database


// END DATABASE

var minPlayers = 2;
var maxPlayers = 9; //must increase card number for more players
var numberOfRounds = 10;
var reduceRoundsBy=1;

var allClients = [];
var players = [];
var spectators = [];

var currentRound = numberOfRounds;
var currentTurn = 0;
var firstPlayer;
var nextToLeadHand;
var nextToLeadRound;


var cardDesc = {
    colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#FF8C00", "#ff00ff"],
              //red       green       blue     yellow      orange     purple
    numPerSuit: 16,
    wordCardColor: "#000000",
    wordCardIdentifyer: -1,
    noneColor: "#ffffff",
    noneCardIdentifyer: -2,
    outs: 4,
    changes: 4,
    wilds: 0,
    minus: 2,
    plus: 2
};

var gameMode = {
    LOBBY: 1,
    BID: 2,
    HAND: 3,
    PLAY: 4,
    END: 5
};

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

var noneCard = {type: "none", owner: "none", color: cardDesc.noneColor, number: cardDesc.noneCardIdentifyer, ID: 0};
var ledCard = noneCard;

var deck = [];
var trumpCard = noneCard;

var pointsPerHand = 1;
var plusBonus = 5;
var minusPenalty = -5;
var missedBidPenalty = -5;
var gotBidBonus = 10;
var userList = [];


function defaultUserData(){
	return {
		ID: "Unknown",
		ready:false,
		cards: [],
		cardSelected: noneCard,
		bid: -1,
		handsWon: [],
		score: 0,
		handScore: 0
	};
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
    updateUser(playerID,"trumpCard", trumpCard);
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
			//var i = players.indexOf(socket);
			player.statusColor = notReadyColor;
			updateBoard(player.ID, notReadyTitleColor , false);
		}
		checkStart();
		console.log("{rage}" + player.userName + " is ready: " + player.ready==true);
		updateUsers();
	}
}
	
function recieveBid(player,bidAmount) {
	if( gameStatus === gameMode.BID ) {
		player.bid = bidAmount;
		console.log('{rage}',player.userName + " bid: " + player.bid);
		player.statusColor = readyColor;
		checkForAllBids();
		updateUsers();
	}
}
function getPrivData(player){
	updateUser(player.ID,"trumpCard", trumpCard);
	updateUser(player.ID,"cards", player.cards)
	let showBoardMessage = {
        titleColor: player.statusColor ,
        displayTitle: (gameStatus==gameMode.LOBBY) ? "flex" : "none",
        displayGame: (gameStatus==gameMode.LOBBY) ? "none" : "flex"
    };
    updateUser(player.ID,"showBoard", showBoardMessage);
	messageOut('all',player.userName+' has returned',serverColor)
	switch(gameStatus){
		case gameMode.BID:
				if(players[currentTurn].ID==player.ID){updateUser(player.ID,'playerLeadsRound',true)};
			messageOut(player.ID, players[currentTurn].userName + " leads this round!", gameColor);
			updateUser(player.ID,"cards", player.cards);
			//reset bids
			player.bid = -1; 
			updateUser(player.ID,"requestBid",currentRound);
			player.statusColor = notReadyColor;
			updateUser(player.ID,'playerLeadsRound',player.ID==players[currentTurn].ID);
		break;
		case gameMode.HAND:
			updateUser(players[currentTurn].ID,"requestCard");
			updateUser(player.ID,"allBidsIn");
		break;
		default:
			console.log('not in bid(2) or hand(3) mode')
			console.log('in mode: '+gameStatus)
	}
	updateALLUsers(userList)
}
function cardSelected(player,cardSubmitted) {
	if( gameStatus === gameMode.HAND) {
		if( players[currentTurn].ID === player.ID ) {
			//get player cards
			var playerCards = player.cards;
			//is the submitted card in players hand?
			var card = noneCard;
			var i;
			for( i = 0; i < playerCards.length; i += 1){
				if( playerCards[i].ID === cardSubmitted.ID ){
					card = playerCards[i]; //find matching card
				} 
			}
			console.log('{rage}', 'cardSubmitted', cardSubmitted.ID, 'card found id', card.ID);
			
			if (card.type !== noneCard.type) {
				if(validCardToPlay(player, card)) {
					player.cardSelected = card;
					player.cards.splice(playerCards.indexOf(card), 1);
					updateUser(player.ID,"cards", player.cards); //update player cards
					
					//console.log('{rage}','input card', cardSubmitted), 
					console.log('{rage}',player.userName + ' selected ', card);
					
					switch(card.type) {
						case "number":
							if(ledCard.type === noneCard.type) {
								ledCard = card;
							}
							break;
						case "wild":
							if(ledCard.type === noneCard.type) {
								ledCard = card;
							}
							updateUser(player.ID,"getWildColorNumber");
							break;
						case "out":
							cardReturnToDeck(trumpCard, deck);
							trumpCard = noneCard;
							sendTrumpToPlayers(trumpCard);
							console.log('{rage}'," no trump card");
							break;
						case "change":
							chooseTrumpCard(deck);
							sendTrumpToPlayers(trumpCard);
							console.log('{rage}',"trump card changed");
							break;
					}
					currentTurn = (currentTurn + 1) % players.length;
					console.log('{rage}',"" + player.userName + " has submitted card: " + player.cardSelected);
					console.log('{rage}', 'next turn');
					updateTurnColor(); //also updates users
				} else {
					player.cardSelected = noneCard;
					console.log('{rage}','card not what is led (if there is something led)');
					messageOut( player.ID, 'You must play the color that is led', gameErrorColor);
				}
			} else {
				console.log('{rage}','card not in hand');
				messageOut(player.ID, 'You do not own that card!', gameErrorColor);
			}
		} else {
			console.log('{rage}','outofTurn');
			messageOut( player.ID, 'It is not your turn!', gameErrorColor);
		}
		checkForAllCards();
	} else {
		console.log('{rage}','notAcceptingCards');
		messageOut( player.ID, 'Wrong mode to accept cards!', gameErrorColor);
	}
}

function renameUser(player,userName) {  
        player.userName = userName;
        //player.ready = false;
        //console.log(__line,"added new user: " + socket.userData.userName);
		//messageOut('all', "" + socket.userData.userName + " has changed name to", serverColor);
        updateUsers();
    };


function updateUsers() {
    console.log('{rage}',"--------------Sending New User List--------------");
    userList = [];
    players.forEach(function(client){
        console.log('{rage}',"userName:", client.userName, " |ready:", client.ready, "| bid:", client.bid, "|status:", client.statusColor);
        console.log('{rage}',"cardtype:", client.cardSelected.type, "|score:", client.score + client.handScore);
		userList.push({
            id: client.ID,
            userName: client.userName,
            numberOfCards: client.cards.length,
            color: client.statusColor,
            cardSelected: client.cardSelected,
            bid: client.bid,
            handsWon: client.handsWon.length,
            cardsLeft: client.cards.length,
			score: client.score + client.handScore
        });
    });
    updateUser('all',"userList", userList);
    console.log('{rage}',"----------------Done Sending List----------------");
}


function updateBoard(socketSend, titleColor, showBoard) {
    var showBoardMessage = {
        titleColor: titleColor,
        displayTitle: (showBoard === true) ? "none" : "flex",
        displayGame: (showBoard === true) ? "flex" : "none"
    };
    updateUser(socketSend,"showBoard", showBoardMessage);
}

function checkStart() {
	var i;
	
	for (i = 0; i < players.length; i += 1){
        console.log('{rage}', "  player"+ i +": " + players[i].ID);
	}
    console.log('{rage}', "playerCount: " + players.length);
    console.log('{rage}',"gameStatus: " + gameStatus);
    if( players.length >= minPlayers && gameStatus === gameMode.LOBBY) {
        var startGame = 1;
        players.forEach(function(client) {
            if( client.ready == false) {
                startGame = 0;
            }
        });
        if(startGame === 1) {
            gameStart();
        }
    }
}

function gameStart() {
	if(useDatabase){
		//get new game id
		function getGameIDCallBack(err, result, fields) {
			console.log('{rage}',"aaaaaaaaaaaaaaaaa", err, result);
			if (err) throw err;
			if (result.length < 1){
				gameId = 0;
			} else {
				gameId = result[0].game_id+1;
			}
			//console.log('{rage}', "game id result: ", gameId);
		}
	
		con.query("SELECT game_id FROM data_per_round ORDER BY game_id DESC, id DESC LIMIT 1", getGameIDCallBack);
	}

	
	
	currentRound = numberOfRounds;
	currentTurn = 0;
	if(players.length > 0){
		console.log('{rage}',"gameStart");
		messageOut('all', "THE GAME HAS STARTED", gameColor);
		gameStatus = gameMode.PLAY;
		//reset colors
		players.forEach(function(client) {
			if ( client.ready === true ) {
				client.statusColor = notYourTurnColor;
				client.cards = [];
				client.cardSelected = noneCard;
				client.bid = -1;
				client.handsWon = [];
				client.score = 0;
				client.handScore = 0;
			} else {
				client.statusColor = spectatorColor;
			}
		});
		updateBoard('all', readyTitleColor, true);
		updateUsers();
		nextToLeadRound = Math.floor(Math.random()*players.length); //random starting person
		startRound();
	}
}

function startRound() {
	players.forEach(function(player){ //reset player for round
		player.cards = [];
		player.handsWon = [];
		player.handScore = 0;
		player.bid = -1;
		player.cardSelected = noneCard;
	});
	
    console.log('{rage}', "round: " + currentRound);
	nextToLeadRound += 1; //next person in order starts round
	nextToLeadHand = currentTurn = nextToLeadRound%players.length;
	console.log('{rage}',players[currentTurn].ID + " leads this round!"); //might need to mod by players.length
	
	updateUser(players[currentTurn].ID,'playerLeadsRound',true);
	messageOut('all', players[currentTurn].userName + " leads this round!", gameColor);
	
    //console.log('{rage}',"deck length: ", deck.length);4
    deck = makeDeck();
    dealCards(deck, currentRound);
    chooseTrumpCard(deck);
    console.log('{rage}',"trump is: " , trumpCard);
    //console.log('{rage}', "deck length: ", deck.length);

    sendCards();
    updateUsers();

    console.log('{rage}'," wait for bids ");
    getBids();
}
function startZeroRound() {
	deck = makeDeck();
	players.forEach(function(player){ //reset player for round
		let cardToGive;
		cardToGive = chooseRandomCard(deck);
        cardToGive.owner = player.ID;
		player.cards = [cardToGive];
		player.handsWon = [];
		player.handScore = 0;
		player.bid = -1;
		player.cardSelected = cardToGive;
	});
	
    console.log('{rage}', "round: " + currentRound);
	nextToLeadRound += 1; //next person in order starts round
	nextToLeadHand = currentTurn = nextToLeadRound%players.length;
	console.log('{rage}',players[currentTurn].ID + " leads this round!"); //might need to mod by players.length
	
	updateUser(players[currentTurn].ID,'playerLeadsRound',true);
	messageOut('all', players[currentTurn].userName + " leads this round!", gameColor);
	
    //console.log('{rage}',"deck length: ", deck.length);4
    
    //dealCards(deck, currentRound);
	
    chooseTrumpCard(deck);
    console.log('{rage}',"trump is: " , trumpCard);
    //console.log('{rage}', "deck length: ", deck.length);

    sendCards();
    updateUsers();

    console.log('{rage}'," wait for bids ");
    getBids();
}
function makeDeck() {
    var cards = [];
	var i;
	var j;
	var cardId = 1; //noneCard is id 0
    for (i = 0; i < cardDesc.colors.length; i+=1) {
        for (j = 0; j < cardDesc.numPerSuit; j+=1) {
            cards.push({type: "number", owner: "deck", color: cardDesc.colors[i], number: j, ID: cardId++});
        }
    }
    for (i = 0; i < cardDesc.outs; i+=1) {
        cards.push({type: "out", owner: "deck", color: cardDesc.wordCardColor, number: cardDesc.wordCardIdentifyer, ID: cardId++});
    }
    for (i = 0; i < cardDesc.changes; i+=1) {
        cards.push({type: "change", owner: "deck", color: cardDesc.wordCardColor, number: cardDesc.wordCardIdentifyer, ID: cardId++});
    }
    for (i = 0; i < cardDesc.wilds; i+=1) {
        cards.push({type: "wild", owner: "deck", color: cardDesc.wordCardColor, number: cardDesc.wordCardIdentifyer, ID: cardId++});
    }
    for (i = 0; i < cardDesc.plus; i+=1) {
        cards.push({type: "plus", owner: "deck", color: cardDesc.wordCardColor, number: cardDesc.wordCardIdentifyer, ID: cardId++});
    }
    for (i = 0; i < cardDesc.minus; i+=1) {
        cards.push({type: "minus", owner: "deck", color: cardDesc.wordCardColor, number: cardDesc.wordCardIdentifyer, ID: cardId++});
    }
    //console.log('{rage}', "card length:", cards.length);
    return cards;
}

function dealCards(cards, amountToBeDelt) {
    players.forEach(function(player) {
        player.cards = [];
		var cardToGive;
		var i;
        for( i = 0; i < amountToBeDelt; i+=1) {
            cardToGive = chooseRandomCard(cards);
            cardToGive.owner = player.ID;
            player.cards.push(cardToGive);
        }
    });
}

function chooseRandomCard(cards) {
    var index = Math.floor(Math.random() * cards.length);
    //if( index >= cards.length) { index =  cards.length - 1; }
    var returnCard = cards[index];
    cards.splice(index, 1);
    return returnCard;
}

function cardReturnToDeck(card, cards) {
    cards.push(card);
}

function chooseTrumpCard(cards) {
    trumpCard = chooseRandomCard(cards);
    var attempt = 0;
	var index;
    while( trumpCard.type !== "number") {
		if( trumpCard.type !== noneCard.type ){
			cardReturnToDeck(trumpCard, cards);
			console.log('{rage}', "trump returned to deck");
		}
        trumpCard = chooseRandomCard(cards);
        attempt += 1;
        if ( attempt > 1000 ) { //give up if no number cards
            cardReturnToDeck(trumpCard, cards);
            index = Math.floor(Math.random() * (cardDesc.colors.length));
            trumpCard = {type: "number", owner: "deck", color: cardDesc.colors[index], number: cardDesc.numPerSuit, ID: -1};
        }
    }
    sendTrumpToPlayers(trumpCard);
}

function sendTrumpToPlayers(trump) {
	updateUser('all',"trumpCard", trump);
}

function sendCards() {
    players.forEach(function(player) {
        updateUser(player.ID,"cards", player.cards);
    });
}

function getBids() {
    gameStatus = gameMode.BID;
    players.forEach(function(player) {
        player.bid = -1; //reset bids
        updateUser(player.ID,"requestBid",currentRound);
        player.statusColor = notReadyColor;
    });
	console.log('{rage}', "get Bids");
    updateUsers();
}

function checkForAllBids() {
	if (gameStatus === gameMode.BID){
		var allBidsIn = true;
		players.forEach(function(player) {
			if (player.bid < 0){
				allBidsIn = false;
			}
		});
		if (allBidsIn) {
			console.log('{rage}',"All Bids In");
			updateUser('all',"allBidsIn");
			let bidTotal = 0; //show how many is bid on total
			players.forEach(function(player) {
				console.log('{rage}',"Bid for: " + player.userName + ": " + player.bid);
				bidTotal += player.bid;
				updateUser(player.ID,'playerLeadsRound', false); //turn off 'you lead' sign
			});
			
			if(useDatabase){
				//log # bid on # to database
				console.log('{rage}', "gameId to send:", gameId);
				let sql = "INSERT INTO data_per_round (Game_Id, Total_Bid, Hand_Size) VALUES (?, ?, ?)";
				con.query(sql, [gameId, bidTotal, currentRound], function (err, result) {
					if (err) throw err;
					console.log("1 record inserted");
				});
			}
			
			
			messageOut( 'all', bidTotal + " bid on " + currentRound, gameColor);
			gameStatus = gameMode.PLAY;
			tallyScoreFromHand(); //show initial score
			getHand();
		}
	}
}

function getHand() {
    gameStatus = gameMode.HAND;
    //check if trump is out
    if (trumpCard.type === noneCard.type ) {
        chooseTrumpCard(deck);
    }
    ledCard = noneCard;
    players.forEach(function(player) {
        player.cardSelected = noneCard; //reset selected
    });
	console.log('{rage}','turn: ', currentTurn, 'player:', players[currentTurn].userName);
    updateUser(players[currentTurn].ID,"requestCard");
	updateTurnColor();
}

function updateTurnColor(){
	players.forEach(function(player){
		player.statusColor = notYourTurnColor;
	});
	players[currentTurn].statusColor = yourTurnColor;
	console.log('{rage}','update turn color');
	updateUsers();
}

function validCardToPlay(player, card) {
	//console.log('{rage}','card: ',card);
	//console.log('{rage}','led: ', ledCard);
    if (ledCard.type === noneCard.type || card.color === ledCard.color) {
        console.log('{rage}','card is whats led = valid');
		return true;
    } else {
        var doesNotHaveColor = true;
        player.cards.forEach(function(pcard) {
			//console.log('{rage}','playerCard', pcard)
			
            if (pcard.color === ledCard.color ) {
                doesNotHaveColor = false;
				//updateUser(player.ID,'mustPlayWhatIsLed');
				console.log('{rage}', 'player has what is led and must play it = invalid');
            }
        });
        return doesNotHaveColor;
    }
}

function checkForAllCards() {
	if (gameStatus === gameMode.HAND){
		var allIn = true;
		players.forEach(function(player) {
			console.log('{rage}','user: ' + player.userName + 
				' selected card type: '+ player.cardSelected.type +
				', number: ' + player.cardSelected.number +
				', color: ' + player.cardSelected.color);
			if (player.cardSelected.type == noneCard.type ) {
				allIn = false;
			}
		});
		
		if(allIn) {
			//console.log('{rage}', "delay start");
			allIn = false; //prevents triggering during delay
			gameStatus = gameMode.PLAY;
			setTimeout(function(){
				//console.log('{rage}', "delay end.");
				updateUser('all',"allCardsIn");
				console.log('{rage}','all cards in');
				whoWinsHand();
			}, 2000);
		}
	}
}

function whoWinsHand() {
	var handWinner = undefined;
    var hand = [];
    var number = -1;
    var trumpPlayers = [];
    var ledPlayers = [];

    players.forEach(function(player) {
        hand.push(player.cardSelected); //collect hand
        if(trumpCard != noneCard && player.cardSelected.color === trumpCard.color) { //sort who played trump
            trumpPlayers.push(player);
        } else if (ledCard != noneCard && player.cardSelected.color === ledCard.color) { //sort who played what was led
            ledPlayers.push(player);
        }
    });
	
	var i;
	if(trumpPlayers.length > 0){ //if there are any trump players
		for (i = 0; i < trumpPlayers.length; i += 1){
			if( trumpPlayers[i].cardSelected.number > number ) {
				handWinner = trumpPlayers[i];
				number = trumpPlayers[i].cardSelected.number;
			}
		}
		console.log('{rage}','trump player wins');
		console.log('{rage}',handWinner.userName + " gets the hand!");
		handWinner.handsWon.push(hand); //add hand to winner
		
	} else if (ledPlayers.length > 0){ //else if there are any players who played what was led
		for (i = 0; i < ledPlayers.length; i += 1){
			if (ledPlayers[i].cardSelected.number > number ) {
				number = ledPlayers[i].cardSelected.number;
				handWinner = ledPlayers[i];
			}
		}
		console.log('{rage}','led card player wins');
		console.log('{rage}',handWinner.userName + " gets the hand!");
		handWinner.handsWon.push(hand); //add hand to winner
		
	} else { //else there must be all word cards
		console.log('{rage}','no one wins the hand');
		handWinner = undefined;
	}
    
	if(handWinner != undefined){
		console.log('{rage}','This person started the previous round', nextToLeadHand, players[nextToLeadHand].userName);
		
		nextToLeadHand = players.indexOf(handWinner); //person who won round
		currentTurn = nextToLeadHand; //goes first for next round
		
		console.log('{rage}','someone won');
		console.log('{rage}','This person won round: ',nextToLeadHand, players[nextToLeadHand].userName);
		console.log('{rage}','This person starts next round: ',currentTurn, players[currentTurn].userName);
		
		messageOut('all', handWinner.userName + " gets the hand!", gameColor);
	} else {
		currentTurn = nextToLeadHand;
		
		console.log('{rage}', 'This person started the previous round', nextToLeadHand, players[nextToLeadHand].userName);
		console.log('{rage}','No one won');
		console.log('{rage}','This person goes next: ',currentTurn, players[currentTurn].userName);
		messageOut('all', "No one gets the hand!", gameColor);
	}
	
	players.forEach(function(player){
		player.cardSelected = noneCard; //reset selected
	});
	
	updateTurnColor(); //updates user
	
    if (playersHaveCards()) { //do players still have cards left?
        tallyScoreFromHand();
		if(trumpCard.type === noneCard.type){
			console.log('{rage}', "No trump at end of trick. Picking a new Trump");
			chooseTrumpCard(deck); //choose new trump if no trump at end of hand
		}
		getHand(); //start next hand
    } else {
		addHandScoreToTotal();
        finishRound(); //finish round
    }
}

function playersHaveCards(){
	var i;
	var cards = false;
	for(i=0; i<players.length; i += 1){
		if(players[i].cards.length > 0){
			cards = true;
		}
	}
	return cards;
}

function tallyScoreFromHand(){
	var score;
	players.forEach(function(player){
		score = 0;
		player.handsWon.forEach(function(hand){
			score += pointsPerHand;
			hand.forEach(function(card){
				if (card.type === 'plus' ){ score += plusBonus; }
				if (card.type === 'minus'){ score += minusPenalty;}
			});
		});
		if( player.handsWon.length != player.bid){
			score += missedBidPenalty;
		} else {
			if(player.bid == currentRound){
				score += currentRound*gotBidBonus;
			} else {
				score += gotBidBonus;
			}
		}
		player.handScore = score;
	});
}

function addHandScoreToTotal(){
	tallyScoreFromHand(); //update hand scores
	players.forEach(function(player){
		player.score += player.handScore;
		player.handScore = 0;
	});
}

function finishRound() {
        currentRound -= reduceRoundsBy;
    if( currentRound > 0) {
        startRound();
    } else if(currentRound==0){
		startZeroRound()
	}else {
        gameEnd();
    }
}

function gameEnd() {
    console.log('{rage}',"gameEnd");
    updateBoard('all', notReadyTitleColor, false);
	messageOut('all', "THE GAME HAS ENDED", gameColor);
	messageOut('all', "Scores: ", gameColor);
	var i = 0;
	for( i = 0; i < players.length; i += 1){
		messageOut('all', players[i].userName + ": " + players[i].score + "\n", gameColor);
	}
	
    players = [];
    console.log('{rage}',"before: ", players.length);
    players.forEach(function(client) {
        client.ready = false;
        client.statusColor = notReadyColor;
    });
    console.log('{rage}',"after: ", players.length);
    gameStatus = gameMode.LOBBY;
    updateUsers();
}

//TODO: 
// wilds
// stop held enter from spamming chat
// check and make sure turn order doesnt break when people leave
// end score screen

