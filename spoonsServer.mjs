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
	setInterval(() => {
	    console.log('live');
	}, 10000);
}
catch(err){
	function updateEachUser(){
		for(let i in playerIDs){
			console.log(playerIDs[i],'updateUser',players[i].privateData)
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


function senderror(ID,error){
	messageOut(ID,error,"#ff0000")
}
function MessageIn(message2server){
	let playerID=message2server.ID
	let command=message2server.command
	let data=message2server.data
	console.log('49 spoonscerver: playerID:',playerID,'command:',command,'data:',data);
	let playerIndex=playerIDs.indexOf(playerID)
	if(playerIndex!=-1){
		switch(command){
			case 'removePlayer':removePlayer(playerIndex); break;
			case 'ready':ready(players[playerIndex].public); break;
			case 'passCard':passCard(players[playerIndex],data); break;
			case 'pickSpoon':pickSpoon(players[playerIndex]); break;
		}
	}else{
		if(command=='addPlayer'){
			addPlayer(playerID)
		}
	}
}


//variables ----------------------------------------------------------------------
var publicItems=[]
var playerIDs=[]
var players=[]
var spoonsLeft=0
var minPlayers=2
var maxPlayers=15
var gameState={
	lobby:0,
	play:1
}
var gameStatus=gameState['lobby']
var found='no'
var lastAdded=undefined
//----------Command Functions-----------------------------------------------------
function addPlayer(ID){
	if(publicItems.length<maxPlayers){
		playerIDs.push(ID)
		players.push({
			public:{
				ready:lastAdded!=undefined,
				spoon:false,
				ID:ID
			},
			hand:[],
			pickfrom:[],
			passTo:lastAdded,
			privateData:{
				handIDs:[],
			}
		})
		publicItems.push(players[players.length-1].public)
		lastAdded=ID
	}
}

function removePlayer(playerIndex){
	if(playerIndex==playerIDs.length){
        players[playerIndex+1].privateData.passTo=players[playerIndex].privateData.passTo
    }
	while(players[playerIndex].hand.length){
		cards.returnCard(players[playerIndex].hand.pop())
	}
	while(players[playerIndex].pickfrom.length){
		cards.returnCard(players[playerIndex].pickfrom.pop())
	}
	playerIDs.splice(playerIndex,1)
	players.splice(playerIndex,1)
	publicItems.splice(playerIndex,1)
}
function ready(pubPlayer){
	pubPlayer.ready=(!pubPlayer.ready)
	let allReady=true
	for(let pubItem of publicItems){
		allReady=(allReady&&pubItem.ready)
	}
	if(allReady&&publicItems.length>=minPlayers){
		gameStart()
	}
}

function passCard(player,card){
	let privPlayer=player.privateData
	let cardIndex=privPlayer.handIDs.indexOf(card)
	if(cardIndex==-1){
		senderror(privPlayer.ID,'Card is not in your hand')
	}else{
		//pass to next privPlayer
		if(player.passTo==undefined){
			cards.returnCard(player.hand.splice(cardIndex,1))
			privPlayer.handIDs.splice(cardIndex,1)
		}else{
			let i=playerIDs.indexOf(player.passTo)
			if(i==-1){console.log('error in pass card')}
			players[i].pickfrom.push(player.hand.splice(cardIndex,1).pop())
		}
		//add next card to hand
		if(player.pickfrom.length==0){
			player.hand=player.hand.concat(cards.deal())
		}else{
			player.hand.push(player.pickfrom.shift())
		}
		updateEachUser()
	}
}
function pickSpoon(player){
	switch(found){
		case 'no': 
			let sameNum=true
			for (card of player.hand){
				sameNum&=(player.hand[0]==card%cards.cardDesc.color.length)
			}
		case 'yes':
			if (spoonsLeft>0&& !player.public.spoon) {
				spoonsLeft-=1
				player.public.spoon=true
			}
			updateALLUsers()
	}
}
//game Functions
function gameStart(){
	spoonsLeft=players.length-1
	cards=new Deck({number:[...Array(maxPlayers).keys()],color: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#FF8C00", "#ff00ff"]})
     																//red       green       blue     yellow      orange     purple
	for (player of players){
		player.hand=cards.deal(cards.cardDesc.color.length)
		for(let i=0;i<player.hand.length;i++){
			player.privateData.handIDs[i]=player.hand[i].ID
		}
		player.public.spoon=false
		player.pickfrom=[]
	}
	gameStatus=gameState['play']
	updateALLUsers()
	updateEachUser()
}
function gameRestart(){
	let noRemove=true
	for (pub of publicItems){
		noRemove&=pub.spoon
		if(!noRemove){
			removePlayer(playerIDs.indexOf(pub.ID))
			gameStart()
			break;
		}
	}
}
