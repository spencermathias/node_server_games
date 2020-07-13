
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

cards=new Deck({number:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#FF8C00", "#ff00ff"]})
             															 //red       green       blue     yellow      orange     purple
function senderror(ID,error){
	messageOut(ID,error,"#ff0000")
}
function MessageIn(playerID,command,data){
	console.log('playerID:',playerID,'command:',command,'data:',data);
	let playerIndex=playerIDs.indexOf(playerID)
	if(playerIndex=!-1){
		switch(command){
			case 'removePlayer':removePlayer(playerIndex) break;
			case 'ready':ready(players[playerIndex].public) break;
			case 'passCard':passCard(players[addplayer(playerID)].private,data) break;
			case 'pickSpoon':pickSpoon(players[addplayer(playerID)].public) break;
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
var players={}
var spoonsLeft=0
var minplayers=2
var maxplayers=cards.cardDesc.number.length
lastAdded=undefined
//----------Command Functions-----------------------------------------------------
function addPlayer(ID){
	if(publicItems.length<maxlength){
		playerIDs.push(ID)
		players.push({
			public:{
				ready:lastAdded!=undefined,
				spoon:false,
				ID:ID
			},
			privateData:{
				hand:[],
				passTo:lastAdded,
				pickfrom:[]
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
	while(players[playerIndex].privateData.hand.length){
		cards.returnCard(players[playerIndex].privateData.hand.pop())
	}
	while(players[playerIndex].privateData.pickfrom.length){
		cards.returnCard(players[playerIndex].privateData.pickfrom.pop())
	}
	playerIDs.splice(playerIndex,1)
	players.splice(playerIndex,1)
	publicItems.splice(playerIndex,1)
}
function ready(pubPlayer){
	pubPlayer.ready=(!pubPlayer.ready)
	let allReady=true
	for(pubItem of publicItems){
		allReady&=pubItem.ready
	}
	if(allReady&&publicItems.length>=minplayers){
		gameStart()
	}
}
function passCard(privPlayer,card){
	let cardIndex=privPlayer.hand.indexOf(card)
	if(cardIndex==-1){
		senderror(ID,'Card is not in your hand')
	}
	//pass to next privPlayer
	if(privPlayer.passTo==undefined){
		cards.returncard(privPlayer.hand.splice(cardIndex,1))
	}else{
		privPlayers[privPlayer.passTo].pickfrom.push(privPlayer.hand.splice(cardIndex,1))
	}
	//add next card to hand
	if(privPlayer.pickfrom.length==0){
		privPlayer.hand.concat(cards.deal())
	}else{
		privPlayer.hand.push(privPlayer.pickfrom.shift())
	}
	updateEachUser
}
function pickSpoon(pubPlayer){
	if (spoonsLeft>0) {
		spoonsLeft-=1
		pubPlayer.spoon=true
	}
}
//game Functions
function getPlayerIndex(ID){

}