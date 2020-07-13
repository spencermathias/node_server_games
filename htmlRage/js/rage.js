try{
	console.log('started rage')
	console.log('deck imported')	
	process.on('message', MessageIn);
	function updateEachUser(){
		for(let i in playerIDs){
			process.send({playerID:playerIDs[i],command:'updateUser',data:players[i].privateData})
		}
	}
	function updateALLUsers(){
		process.send({playerID:'all',command:'userList',data:publicItems})
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
	function updateEachUser(){
		for(let i in playerIDs){
			console.log(playerIDs[i],'updateUser',players[i].privateData)
		}
	}
	function updateALLUsers(){
		console.log('all','userList',publicItems)
	}
	function messageOut(ID, message, color="#ffff00"){
		var messageObj = {
			data: "" + message,
			color: color
		};
		console.log(ID,'message',messageObj);
	}
	var __line='spoonsServer'
}

function senderror(ID,error){
	messageOut(ID,error,"#ff0000")
}
function MessageIn(message2server){
	let playerID=message2server.ID
	let command=message2server.command
	let data=message2server.data
console.log('{spoons}53',playerID,'command:',command,'data:',data);
	let playerIndex=playerIDs.indexOf(playerID)
	if(playerIndex!=-1){
		console.log('playerIndex',playerIndex)
		switch(command){
			case 'addPlayer':getPrivData(); break;
			case 'removePlayer':removePlayer(playerIndex); break;
			case 'ready':ready(players[playerIndex].public); break;
			case 'passCard':passCard(players[playerIndex],data); break;
			case 'pickSpoon':pickSpoon(players[playerIndex]); break;
			case 'restart':gameRestart(); break;
			case 'end':gameEnd();break;
		}
	}else{
		if(command=='addPlayer' && gameStatus==gameState['lobby']){
			console.log('adding player')
			addPlayer(playerID)
		}else{
			updateALLUsers()
		}
	}
	//console.log('end of message in')
}
//variables ----------------------------------------------------------------------
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

var noneCard = {type: "none", owner: "none", color: cardDesc.noneColor, number: cardDesc.noneCardIdentifyer, id: 0};
var ledCard = noneCard;

var deck = [];
var trumpCard = noneCard;

var pointsPerHand = 1;
var plusBonus = 5;
var minusPenalty = -5;
var missedBidPenalty = -5;
var gotBidBonus = 10;
//----------Command Functions-----------------------------------------------------
function addPlayer(ID){
	//console.log('in add player function')
	if(publicItems.length<maxPlayers){
		console.log('publicItems.length',publicItems.length)
		playerIDs.push(ID)
		players.push({
			public:{
				ready:lastAdded!=undefined,
				cardSelected: noneCard,
				ID:ID,
				bid: -1,
				score: 0,
				handScore: 0
			},
			cards:[],
			pickfrom:[],
			passTo:lastAdded,
		})
		publicItems.push(players[players.length-1].public)
		lastAdded=ID
	}
	updateALLUsers()
}

function defaultUserData(){
	return {
		userName: "Unknown",
		//cards: [],
		//cardSelected: noneCard,
		bid: -1,
		handsWon: [],
		score: 0,
		handScore: 0
	};
}