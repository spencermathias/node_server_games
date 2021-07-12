//socket stuff
var socket = io(window.location.href)
socket.on('connect', () => {
    //socket.emit('gameCommands',{command:'addPlayer'});
	console.log("Connection successful!")
});

function updateUser(){
	console.log('what?!')
}
socket.on('userList',updatepublic)
socket.on('updateUser',updateUser)
socket.on('getOldID',(callBack)=>{
	if(localStorage.id !== undefined){
		console.log(localStorage)
		callBack({ID:localStorage.id,name:localStorage.userName})
	}
	localStorage.id = socket.id;
	socket.emit('gameCommands',{command:'addPlayer',data:localStorage.userName});
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
function updateRules(){
	socket.emit('gameCommands',{command:'getRules'})
}
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
  updateRules()
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
function closeModal() {
  console.log("clicked off")
  modal.style.display = "none";
  optionsEditor.style.display = "none"
}

// When the user clicks anywhere outside of the modal, close it
/*
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
	optionsEditor.style.display = "none"
  }
}
*/
var optionsEditor = document.getElementById("optionsEditor");
var adjustBtn=document.getElementById("changeRule");
adjustBtn.onclick=function(event){
	modal.style.display = "none";
	optionsEditor.style.display= "block"
	$("#numCardTable > tbody").empty();
	let tableString=""
	let show0round=false
	for(let i=0;i<options.options.cardsForRounds.length;i++){
		if(i>options.rn | options.rn!=undefined){
			tableString+="<tr><td><input type='checkbox' name='record'></input></td><td>"+i+"</td><td><input type='number' max=10 min=0  value="+options.options.cardsForRounds[i]+"></input></td></tr>"
		}else{
			tableString+="<tr><td></td><td>"+i+"</td><td>"+options.options.cardsForRounds[i]+"</td></tr>"
		}
	}
	$('#numCardTable > tbody:last-child').append(tableString);
	$("#colorCardTable > tbody").empty();
	tableString=""
	for(let i=0;i<options.options.cardDesc.colors.length;i++){
		tableString+="<tr><td><input type='checkbox' name='record'></input></td><td><input type='color' value="+options.options.cardDesc.colors[i]+"></input></td></tr>"
	}
	$('#colorCardTable > tbody:last-child').append(tableString);
}
function stopclick(event){event.stopPropagation()}
function verifycolor(htcolor){
	
	let c256=htcolor.value.match(/[A-Za-z0-9]{2}/g).map(function(v) { return parseInt(v, 16) })
	color="#"
	for( c of c256){
		c=Math.round(c/51)*51
		a=c.toString(16)
		if ((a.length % 2) > 0) {
			a = "0" + a;
		}
		color+=a
	}
	htcolor.value=color
	
}
function removeRow(tableName){
	let removed=false
	let i=0
	$("#"+tableName.id).find('input[name="record"]').each(function(){
		if($(this).is(":checked")){
			$(this).parents("tr").remove();
			removed=true
			i--
		}else if(removed && $(this).parents("tr").children().length==3){
			$(this).parents("tr").children()[1].innerHTML=i
		}
		i++
		
	});
}
function addRoundRow(){
	let lastrow=$("#numCardTable").children()[1].lastChild
	let i=parseInt(lastrow.children[1].innerHTML)+1
	let htmltext="<td><input type='checkbox' name='record'/></td><td>"+i+"</td><td><input type='number' max=10 min=0 value="+$('#rn').val()+"></input></td>"
	lastrow.parentElement.insertRow(-1).innerHTML=htmltext
}
function addColorRow(){
	let lastrow=$("#colorCardTable").children()[1].lastChild
	let htmltext="<td><input type='checkbox' name='record'></input></td><td><input type='color' value="+$('#newCardColor').val()+"></input></td>"
	lastrow.parentElement.insertRow(-1).innerHTML=htmltext
}
function onChangefunct(name){
	changedvalues[name]=true
}
function sendOptions(){
	let data={}
	if(changedvalues["cardsForRounds"]){
		let cardRounds=[]
		$('#numCardTable > tbody').children().each(function(){
			cardRounds.push(parseInt($(this).children().find("input")[1].value))
		})
		data["cardsForRounds"]=cardRounds
	}
	if(changedvalues["colors"]){
		let cardcolors=[]
		$('#colorCardTable > tbody').children().each(function(){
			cardcolors.push($(this).children().find("input")[1].value)
		})
		data["cardOptions"]={colors:cardcolors}
	}
	if(changedvalues["numPerSuit"]){
		data["cardOptions"]={...data["cardOptions"],numPerSuit:parseInt($('#numPerSuit').val())+1}
	}
	console.log(data)
	//data={cardsForRounds:[10,9,8,7,6,5,4,3,2,1,0],cardOptions:{colors:["#990000","#990099", "#009900","#ffff00","#000099","#009999"],numPerSuit:16}}
	socket.emit('gameCommands',{command:'options',data})
	changedvalues={cardsForRounds:false,colors:false,numPerSuit:false}
	closeModal()
}

/*Initializing the connection with the server via websockets */
var myCards = [];
var trumpCard = {};
var tableCenter = {x:0,y:0};
var shapes = [];
var userList = [];
var showBid = false;
var spectatorColor = "#444444";
var noneCard = {type: "none", owner: "none", color: "#ffffff", number: -2, ID: 0};
var zeroRound=false
var InputList;
var options={}
var changedvalues={cardsForRounds:false,colors:false,numPerSuit:false}

function updatepublic(data){
	var userListString = '';
	userList = [];
	for( var i = 0; i < data.length; i++ ){
		
		var header = 'div id="userListDiv'+ i + '"';
		var click = 'onclick="changeName(' + "'" + data[i].id + "'" + ')"';
		var color = ' style="color: ' + data[i].color + ';"'
		var string = '' + data[i].userName;
		var ender = '</div>';
		
		userListString = userListString + '<' + header + click + color + '>' + string + ender;
		
		//userListString = userListString + '<div style="color: ' + data[i].color + ';">' + data[i].userName + '</div>';
		//console.log(data[i].userName + ' bid: ' + data[i].bid);
		if(data[i].color != spectatorColor){
			userList.push(data[i]);
		}
		InputList = data;
	}
	document.getElementById('userlist').innerHTML = userListString;
	console.table(data);
};

socket.on('showBoard',function(data){
	$('#title').css('color', data.titleColor);
	$('#content').css('display', data.displayTitle);
	$('#gameBoard').css('display', data.displayGame);
	showBidScreen(false);
	resizeCanvas();
});

socket.on('trumpCard', function(card){
	trumpCard = card;
	resizeDrawings();
	console.log( 'trump card: ', card);
});

socket.on('cards', function(cards){
	myCards = cards;
	resizeDrawings();
	console.log('cards for round: ', myCards);
});

socket.on('requestBid', function(roundNumber){
	//TODO:put zero round flag here
	showBid = false;
	console.log('request bid');
	if(roundNumber==0){
		showBidScreen(1);
		zeroRound=true
	}else{
		showBidScreen(roundNumber);
		zeroRound=false
	}
	$('#bidArray').find('.bidButton').removeClass('selected');
	resizeDrawings()
});

socket.on('allBidsIn', function(){
	showBid = true;
	console.log('all bids in!');
	showBidScreen(false);
});

socket.on('requestCard', function(){
	console.log('request card');
});

socket.on('allCardsIn', function(){
	console.log('all cards in');
});

socket.on('playerLeadsRound', function(playerLeads){
	console.log('Does the player lead the round? ', playerLeads);
	if(playerLeads){
		$('#leadMessage').css('display', 'flex');
	} else {
		$('#leadMessage').css('display', 'none');
	}
	resizeCanvas();
});
socket.on('recievedRules', function(data){
	options=data
	//change number of players
	$('#playercount').text(''+data.minPlayers+'-'+data.maxPlayers)
	//show example cards
	let maxNum=data.options.cardDesc.numPerSuit
	let colors=data.options.cardDesc.colors
	currentRound=data.currentRound
	rowsOfNumCards=[]
	numberCards=[]
	exampleCards=[]
	for(i=0;i<colors.length;i++){
		numberCard={type:"number",color:colors[i],number:((maxNum-1-i)%maxNum+maxNum)%maxNum}
		numberCards.push(numberCard)
		if((i)%6==5){
			rowsOfNumCards.push(numberCards)
			numberCards=[]
		}
	}
	if(numberCards.length!=0){
		rowsOfNumCards.push(numberCards)
		numberCards=[]
	}
	
	cardCanvas.width=cardCanvas.clientWidth;
	cardCanvas.height=cardCanvas.clientWidth*1.3/6*(rowsOfNumCards.length);
	
	for(i=0;i<rowsOfNumCards.length;i++){
		exampleCards=exampleCards.concat(drawMyCards(rowsOfNumCards.length-i-1,6,rowsOfNumCards[i],cardCanvas,(100/rowsOfNumCards.length)))
	}
	console.log(data)
	for(i =0; i<exampleCards.length; i++){
		drawCard(cardsInPlay,exampleCards[i])
	}
	//show round numbers
	$("#myTable > tbody").empty();
	let tableString=""
	let show0round=false
	for(let i=0;i<data.options.cardsForRounds.length;i++){
			tableString+="<tr><td>"+i+"</td><td>"+data.options.cardsForRounds[i]+"</td></tr>"
		if(data.options.cardsForRounds[i]==0){
			show0round=true
		}
	}
	$('#myTable > tbody:last-child').append(tableString);
	$('#myTable > tbody > tr').eq(options.rn).css("background","yellow");
	if(show0round){
		$('#zeroRoundrules').css('display', 'flex')
	}else{
		$('#zeroRoundrules').css('display', 'none')
	}
});

$('#submit').click(function(){ /*listening to the button click using Jquery listener*/
	var data = { /*creating a Js ojbect to be sent to the server*/ 
		message:$('#message').val() /*getting the text input data      */             
	}
	socket.send(JSON.stringify(data)); 
	/*Data can be sent to server very easily by using socket.send() method 
	The data has to be changed to a JSON before sending
						  it (JSON.stringify() does this job )*/
	/* This triggers a message event on the server side 
	and the event handler obtains the data sent */ 

	$('#message').val('');
	return false;
});
$('#title').click(function(){
	if ( $(this).css('color') == 'rgb(255, 0, 0)'){
		<!-- $(this).css('color', '#00ff00'); -->
		socket.emit('gameCommands',{command:'ready'});
	} else {
		<!-- $(this).css('color', '#ff0000'); -->
		socket.emit('gameCommands',{command:'ready'});
	}
	return false;
});

$('.bidButton').click(function(){
	$(this).parent().find('.bidButton').removeClass('selected');
	$(this).addClass('selected');
	let val = parseInt($(this).attr('id'));
	socket.emit('gameCommands',{command:'recieveBid', data: val}); 
	console.log(val);
	return false;
});

function checkClick(event){
	var i;
	var area;
	var offset = $('#gameBoard').position();
	var scale = {x: canvas.width / $('#gameBoard').width(), y: canvas.height/ $('#gameBoard').height()};
	//console.log('click', {x: event.clientX, y: event.clientY});
	//console.log('scale:', scale)
	var click = {x: event.clientX*scale.x - offset.left, y: event.clientY*scale.y - offset.top};
	//console.log('adjusted click: ', click);
	for( i = 0; i < myCards.length; i += 1){
		if( myCards[i].card.clickArea ){
			area = myCards[i].card.clickArea;
			//console.log(area);
			if( click.x  < area.maxX){
				if( click.x > area.minX){
					if( click.y < area.maxY){
						if( click.y > area.minY){
							console.log('cardClicked: ', myCards[i]);
							socket.emit('gameCommands',{command:'cardSelected', data:myCards[i]});
						}
					}
				}
			}
		} else {
			console.log('no click area');
		}
	}
}

function showBidScreen(num){
	let show=typeof num==='number'
	if(typeof num==='number'){
		for( i=0; i<11; i++){
			let bidTile='#'+i
			$(bidTile).css('display',(i<num+1) ? 'flex' : 'none')
		}
	}
	$('#bidOverlay').css('display', (show) ? 'flex' : 'none');
	
	resizeCanvas();
}

//drawing stuff
var canvas = document.getElementById("gameBoard");
ctx = canvas.getContext("2d");
//console.log('ctx', ctx);
//console.log(canvas.width, canvas.height);
var cardCanvas = document.getElementById("cardsInPlay");
cardsInPlay = cardCanvas.getContext("2d");

function draw(){
	//console.log('draw: ', shapes );
	ctx.clearRect(0,0,canvas.width, canvas.height);
	
	//table
	ctx.fillStyle = '#777777';
	ctx.strokeStyle = '#000000';
	var radius = (Math.min(canvas.width, canvas.height-140)/2)-50;
	var angle = (2*Math.PI)/Math.max(4,userList.length)
	polygon(
		ctx, 
		tableCenter.x, 
		tableCenter.y,
		radius, //radius
		Math.max(4,userList.length),
		(Math.PI/2)-(angle/2)
	);
	ctx.fill();
	
	//draw played or selected cards on the table
	var startPlayer = 0;
	for( i = 0; i < userList.length; i += 1 ){
		if(userList[i].id === socket.id){
			startPlayer = i;
		}
	}
	selected = drawSelected(radius);
	var i;
	var fontSize = Math.min(canvas.height, canvas.width)/30;
	var offset;
	var lowerAlignment = radius*Math.cos(angle/2)+fontSize/2;
	for( i = 0; i < selected.length; i += 1){
		player = (startPlayer + i)% selected.length;
		//console.log('startplayer', player);
		ctx.save();
		ctx.translate(tableCenter.x, tableCenter.y);
		ctx.rotate(i*angle);
		if(!zeroRound||showBid||i!=0){
		    selected[player] = drawCard(ctx, selected[player]);
		}
		ctx.fillStyle = userList[player].color;
		ctx.font = fontSize + "px Arial Black, Gadget, Arial, sans-serif";
		ctx.textAlign="center";
		ctx.textBaseline = "middle";
		offset = selected[player].width/2 + fontSize
		//lowerAlignment = selected[player].y + selected[player].height/2 + fontSize;
		ctx.fillText(userList[player].userName, 0, radius);
		if(showBid === true){
			ctx.fillText(userList[player].handsWon, offset, lowerAlignment);
			ctx.fillText('▬', offset, lowerAlignment + fontSize/2);
			ctx.fillText(userList[player].bid, offset, lowerAlignment + 1.2*fontSize);
		} else {
			ctx.fillText('0', offset, lowerAlignment);
			ctx.fillText('▬', offset, lowerAlignment + fontSize/2);
			ctx.fillText('█', offset, lowerAlignment + 1.2*fontSize);
		}
		ctx.fillText('score', -offset - fontSize, lowerAlignment);
		ctx.fillText(userList[player].score, -offset - fontSize, lowerAlignment + fontSize);
		ctx.restore();
	}
	
	//draw cards
	for( i = 0; i < shapes.length; i += 1){
		curShape = shapes[i];
		drawCard(ctx, curShape);
	}
	setTimeout(draw, 100); //repeat
}

draw();

function drawCard(ctx, curShape){
	ctx.save();
	ctx.strokeStyle = curShape.outline;
	ctx.fillStyle = curShape.color;
	roundRect(
		ctx, 
		curShape.x - (curShape.width/2), 
		curShape.y - (curShape.height/2), 
		curShape.width, curShape.height, 
		curShape.width/8, 
		curShape.color, 
		curShape.outline
	);
	//addHitbox
	curShape.clickArea = {
		minX: curShape.x - (curShape.width/2),
		maxX: curShape.x + (curShape.width/2),
		minY: curShape.y - (curShape.height/2),
		maxY: curShape.y + (curShape.height/2)
	}
	//draw number
	ctx.font = '' + curShape.fontSize + "px Arial Black, Gadget, Arial, sans-serif";
	ctx.textBaseline = "middle"
	ctx.textAlign="center";
	ctx.fillStyle = '#ffffff';
	ctx.strokeStyle = '#000000';
	
	ctx.translate(curShape.x, curShape.y);
	if(curShape.textSlant){
		ctx.rotate(Math.atan(curShape.height/curShape.width));
	}
	ctx.fillText(curShape.text,0,-curShape.fontSize*.04);
	ctx.strokeText(curShape.text, 0, -curShape.fontSize*.04);
	ctx.restore();
	return curShape;
}

function drawMyCards(rowNumber=0,maxCards=10,Cards=myCards,activeCanvas=canvas,maxHightpercent=10){
	var myCardShapes = [];
	if (Cards.length > 0){
		var i;
		var shape = {};
		var half = Math.floor(Cards.length/2);
		var spacing = activeCanvas.width/maxCards;
		var width = Math.min(activeCanvas.height*maxHightpercent/100, activeCanvas.width/(maxCards*1.5));
		var height = width*1.3;
		//console.log(spacing,width,height)
		var text;
		var fSize;
		var textSlant;
		for (i = 0; i <  Cards.length; i += 1) {
			if( Cards[i].type === 'number' ){
				text = '' + Cards[i].number;
				fontSize = width/2;
				textSlant = false;
			} else {
				text = '' + Cards[i].type;
				fontSize = Math.sqrt(width*width+height*height)/text.length;
				textSlant = true;
			}
			Cards[i].card = {
				x: (activeCanvas.width/2) + (i - half + .5)*spacing,
				y: activeCanvas.height - (height/2+height*rowNumber*1.1) - Math.min(20, (spacing-width)/2),
				width: width,
				height: height,
				color: Cards[i].color,
				outline: '#000000',
				text: text,
				fontSize: fontSize,
				textSlant: textSlant
			}	
			myCardShapes.push(Cards[i].card);
		}
	}
	return myCardShapes;
}

function drawTrump(){
	var shape = {};
	if( trumpCard ){
		var text;
		var slant;
		var fontSize;
		var width = Math.min(canvas.height, canvas.width)/10;
		var height = (Math.min(canvas.height, canvas.width)/10)*1.3;
		if(trumpCard.type == 'none'){
			text = 'none';
			slant = true;
			fontSize = Math.sqrt(width*width+height*height)/text.length;
		} else {
			text = '' + trumpCard.number;
			slant = false;
			fontSize = width/2;
		}
			
		shape = {
			x: tableCenter.x,
			y: tableCenter.y,
			width: width,
			height: height,
			color: trumpCard.color,
			outline: '#000000',
			text: text,
			fontSize: fontSize,
			textSlant: slant
		}
	}
	return shape;
}

function drawSelected(radius){
	var shapes1 = [];
	var i;
	var width = Math.min(canvas.height, canvas.width)/10;
	var height = (Math.min(canvas.height, canvas.width)/10)*1.3;
	for( i = 0; i < userList.length; i += 1){
		card = userList[i].cardSelected;
		//console.log(card);
		if( card.type === 'number' ){
			text = '' + card.number;
			fontSize = width/2;
			textSlant = false;
		} else {
			text = '' + card.type;
			fontSize = Math.sqrt(width*width+height*height)/text.length;
			textSlant = true;
		}
		shape = {
			x: 0,
			y: radius/2,
			width: width,
			height: height,
			color: card.color,
			outline: '#000000',
			text: text,
			fontSize: (Math.min(canvas.height, canvas.width)/10)/2,
			textSlant: textSlant
		}
		shapes1.push(shape);
	}
	return shapes1;
}

function resizeCanvas(){
	canvas.width = window.innerWidth - $('#sidebar').width() - 50;
	canvas.height = window.innerHeight - $('#bidOverlay').height()- 50;
	
	console.log('canvas resized to: ', canvas.width, canvas.height);
	tableCenter = {x:canvas.width/2,y:canvas.height/2 
		- Math.min(canvas.height/10, canvas.width/15)*1.3*.5
		- Math.min(20, (canvas.width/10- Math.min(canvas.height/10, canvas.width/15))/2)};
	resizeDrawings();
}

function resizeDrawings(){
	if(!zeroRound||showBid){
		shapes = drawMyCards();
	}else{
		shapes=[]
	}
	shapes.push(drawTrump());
}

/*
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object 
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
 
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
	stroke = true;
  }
  if (typeof radius === 'undefined') {
	radius = 5;
  }
  if (typeof radius === 'number') {
	radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
	var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
	for (var side in defaultRadius) {
	  radius[side] = radius[side] || defaultRadius[side];
	}
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
	ctx.fill();
  }
  if (stroke) {
	ctx.stroke();
  }
}

function polygon(ctx, x, y, radius, sides, startAngle, anticlockwise) {
	if (sides < 3) return;
	var a = (Math.PI * 2)/sides;
	a = anticlockwise?-a:a;
	ctx.save();
	ctx.translate(x,y);
	ctx.rotate(startAngle);
	ctx.moveTo(radius,0);
	for (var i = 1; i < sides; i++) {
		ctx.lineTo(radius*Math.cos(a*i),radius*Math.sin(a*i));
	}
	ctx.closePath();
	ctx.restore();
}