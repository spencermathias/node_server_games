try{
	console.log('started spoons')
	Deck=require('../gameHelperFunctions/deck.js')
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
	
	//loopPulse=setInterval(() => {console.log('live');}, 10000);
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
var lastAdded=undefined
//----------Command Functions-----------------------------------------------------
function addPlayer(ID){
	console.log('in add player function')
	if(publicItems.length<maxPlayers){
		console.log('publicItems.length',publicItems.length)
		playerIDs.push(ID)
		players.push({
			public:{
				ready:lastAdded!=undefined,
				spoon:false,
				ID:ID,
				userName:'userName'
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
	updateALLUsers()
}
function getPrivData(){
	//messageOut('all','players updated')
	updateALLUsers()
	updateEachUser()
}
function removePlayer(playerIndex){
	if(playerIndex!=playerIDs.length-1){
        players[playerIndex+1].passTo=players[playerIndex].passTo
    }
	while(players[playerIndex].hand.length){
		cards.returnCard(players[playerIndex].hand.pop())
		console.log(players[playerIndex].hand.length)
	}
	while(players[playerIndex].pickfrom.length){
		cards.returnCard(players[playerIndex].pickfrom.pop())
	}
	spoonsLeft-=1
	playerIDs.splice(playerIndex,1)
	players.splice(playerIndex,1)
	publicItems.splice(playerIndex,1)
	console.log('players left',players)
	if(players.length<minPlayers){gameEnd()};
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
		console.log(player.public.ID,'Card is not in your hand')
		senderror(player.public.ID,'Card is not in your hand')
	}else{
		//add next card to hand
		if(player.pickfrom.length==0){
			console.log('picked from deck')
			if(cards.pile.length){
				console.log('pile length',cards.pile.length)
				let newCard=cards.deal()
				console.log('newCard',newCard)
				privPlayer.handIDs.push(newCard[0].ID)
				player.hand.push(newCard.pop())
			}else{console.log('no more cards')}
		}else{
			let newCard=player.pickfrom.shift()
			console.log(newCard)
			privPlayer.handIDs.push(newCard.ID)
			player.hand.push(newCard)
		}
		//pass to next privPlayer
		if(privPlayer.handIDs.length!=cards.cardDesc.color.length){
			if(player.passTo==undefined){
				cards.returnCard(player.hand.splice(cardIndex,1).pop())
				privPlayer.handIDs.splice(cardIndex,1)
			}else{
				let i=playerIDs.indexOf(player.passTo)
				if(i==-1){console.log('error in pass card')}
				players[i].pickfrom.push(player.hand.splice(cardIndex,1).pop())
				privPlayer.handIDs.splice(cardIndex,1)
			}
			console.log('new hand',player.hand)
			console.log('new handIDs',privPlayer.handIDs)
			updateEachUser()
		}
		//clearInterval(loopPulse)
	}
}

function pickSpoon(player){
	console.log('publicItems',publicItems)
	if (publicItems.some((player)=>player.spoon)){
		console.log('some-player',player)
		if (spoonsLeft>0&& !player.public.spoon) {
			player.public.spoon=true
			spoonsLeft--
		};
	}else{
		console.log('no spoon taken',player)
		if(player.hand.every((currentCard) => currentCard.number == player.hand[0].number)){
			player.public.spoon=true
			console.log('player',player.public)
			spoonsLeft--
		};
	}
	updateALLUsers()
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
	//debugger
}
function gameRestart(){
	if(spoonsLeft==0){
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
}
function gameEnd(){
	return process.exit(0)
}



