const { fork } = require('child_process');
//const express = require('express');
const http = require('http');
var io = require('socket.io');
var express = require('express'); // for serving webpages
//var conDB=require('./mysqlConfig/databaseLogin.js')
var app = express();
var uid =require( 'uid').uid;
console.log(uid)
var port=8080

var server = http.createServer(app).listen(port,"0.0.0.0",511,function(){console.log(__line,"Server connected to socket: "+port);});//Server listens on the port 8124
console.log('server started')
io = io.listen(server);

app.use(express.static('./IPconfiguration'))
app.use(express.static('./gameHelperFunctions'))
var novelCount=0
var IDs={
	socketsIDs:{},
	gameIDs:{},
	addID(socketsID){
		let gameID=uid()+novelCount++
		this.socketsIDs[socketsID]=gameID
		this.gameIDs[gameID]=socketsID
		return gameID
	}
}
var allClients={}
var gameStatus=1
var serverColor='#000000'
var chatColor = "#ffffff";
var allforked={}
var room=-1

function defaultUserData(gameID){
	if(gameID==undefined){
		return {}
	}
	return {
		userName: "player"+gameID.slice(11),
		childProcessName:'',
		myIDinGame:gameID
	}
}

//to make lobbies work
var activeGames = [];
/*
conDB.connect(function(err) {
  if (err) throw err;
});
function getGameIDCallBack(err, result, fields) {
  //console.log(__line,"aaaaaaaaaaaaaaaaa", err, result);
  if (err) throw err;
   activeGames = result;
}
let queryReadyGames = " SELECT ID, type FROM allGames WHERE Status = 'ready' ORDER BY id DESC";
conDB.query(queryReadyGames, getGameIDCallBack)
setInterval(()=>conDB.query(queryReadyGames, getGameIDCallBack),10000)
*/
app.use('/lobbies',  function (req, res){
	res.send(activeGames);
	//res.send(q);
});


//connections to lobby
io.sockets.on("connection", function(socket) {
	socket.userData={}
	let roomname=socket.conn.request._query.ID
	console.log(__line, "lobby Connection with client " + socket.id +" established in room: "+roomname);
	socket.join(roomname)
	socket.emit('getOldID',(data)=>{
		console.log('this is data ',data)
		let gameID=IDs.socketsIDs[data.ID]
		console.log('current IDs ',IDs)
		console.log('gameID',gameID)
		//console.log('allforked',allforked)
		if(gameID!=undefined){
			console.log('not undefined gameID',gameID)
			IDs.gameIDs[gameID]=socket.id
			IDs.socketsIDs[socket.id]=gameID
			delete IDs.socketsIDs[data.ID]
			//console.log('current clients ',allClients)
			socket.userData=allClients[gameID]
			//console.log('this socket userData ',socket.userData)
			socket.userData.childProcessName=roomname
			socket.userData.userName=data.name
			allClients[socket.userData.myIDinGame].childProcessName='inMainLobby'
			allClients[socket.userData.myIDinGame].userName=data.name
			//console.log('this socket userData ',socket.userData)
			if(allforked[socket.userData.childProcessName]!=undefined){
				socket.on('gameCommands',(message2server)=>{
					console.log('sending comand to ',socket.userData.childProcessName)
					message2server.ID=socket.userData.myIDinGame
					allforked[socket.userData.childProcessName].send(message2server)
				});
				socket.on("disconnect",function() {
					let room=socket.userData.childProcessName
					//message( socket.to(room), "" + socket.userData.userName + " has left.", serverColor);
					//message( socket.to(room), "Type 'kick' to kick disconnected players", serverColor);
					console.log(__line,"disconnected: " + socket.userData.userName + ": " + socket.id);
					//allforked[socket.userData.childProcessName].disconnectedPlayers.push(socket.userData.myIDinGame)
				});
			}
		}else{
			gameID=IDs.addID(socket.id)
			allClients[gameID]=defaultUserData(gameID)
			allClients[gameID].userName=data.name
		}
	})
	
	message(socket, "Connection established!", serverColor)

    console.log(__line, "Socket.io Connection with client " + socket.id +" established");

    socket.on("disconnect",function() {
		message( io.sockets, "" + socket.userData.userName + " has left.", serverColor);
		message( io.sockets, "Type 'kick' to kick disconnected players", serverColor);
        console.log(__line,"disconnected: " + socket.userData.userName + ": " + socket.id);
        //let i = allClients.indexOf(socket);
        //if(i >= 0){ allClients.splice(i, 1); }
		//i = spectators.indexOf(socket);
        //if(i >= 0){ spectators.splice(i, 1); }
        // if(gameStatus!=gameMode.LOBBY){
        // 	let i = players.indexOf(socket)
        // 	if(i >= 0){players.disconnected=true}
        // }
		//updateUsers();
        //players are only removed if kicked
    });
	

    socket.on("message",function(data) {
        /*This event is triggered at the server side when client sends the data using socket.send() method */
        data = JSON.parse(data);

        console.log(__line, "data: ", data);
        /*Printing the data */
		message( socket, "You: " + data.message, chatColor);
		message( socket.broadcast, "" + socket.userData.userName + ": " + data.message, chatColor);

        if(data.message === "end") {
            console.log(__line,"forced end");
            //closeGame();//????
        } else if(data.message === "start") {
            console.log(__line,"forced start");
            //gameStart();
        } else if(data.message.toLowerCase() === "kick"){
			console.log(__line, "clearing players");
			//uncrib.kickPlayers()
		}
        /*Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side*/
    });

    socket.on("userName", function(userName) {
        allClients[socket.userData.myIDinGame].userName=userName
		socket.userData.userName = userName;
        console.log(__line,"user changed name " + socket.userData.userName);
		message(io.sockets, "" + socket.userData.userName + " has changed name", serverColor);
        //updateUsers();
    });

    socket.on('newgame',(type)=>{
		console.log(type)
		let connectorSocket={}
		let validType=true
		let newgame=''
		switch(type){
			case 'Spoons':
				newgame='spoonsServer.js'
				connectorSocket=spoonsConnect
				
			break;
			case 'Rage':
				newgame='rageServer.js'
				connectorSocket=rageConnect
			break;
			case 'Quinto':
				newgame='quintoServer.js'
				connectorSocket=quintoConnect
			break;
			case 'Pit':
				newgame='pitServer.js'
				connectorSocket=pitConnect
			break;
			default:validType=false;
		}
		if(validType){
			console.log('validType'+validType)
			room+=1
			//socket.userData.myIDinGame=socket.id
			//new forked
			let forked = fork('gameEngines/'+newgame);
			//forked.send({ID:socket.userData.myIDinGame,command:'addPlayer'})
			forked.room=''+newgame.split('Server')[0]+room
			forked.connectorSocket=connectorSocket
			forked.disconnectedPlayers=[]
			forked.on('message', (msg) => {
				let playerID=msg.playerID
				let command=msg.command
				let data=msg.data
				if(playerID=='all'){
					console.log(__line,'child to all:');
					if(command=='userList'){
						for(user of data){
							if(user.ID!=undefined){
								user.userName=allClients[user.ID].userName
								user.ID=IDs.gameIDs[user.ID]
								console.log(__line,user)
							}else{user.id=IDs.gameIDs[user.id]}
						}
					}
					console.log('msg',msg)
					console.log('room',forked.room)
					forked.connectorSocket.in(forked.room).emit(command,data)
				}else{
					//debugger
					console.log(__line,'child to '+playerID)
					console.log(msg)
					forked.connectorSocket.to(IDs.gameIDs[playerID]).emit(command,data)
				}
			});
			forked.on('exit', function(code) {
				console.log(`About to exit ${forked.room} with code ${code}`);
				forked.connectorSocket.in(forked.room).emit('forward to room','/')
				delete allforked[forked.room]
				activeGames=[]
				for(game in allforked){activeGames.push({name:game,URL:allforked[game].URL})}
			});
			let forkedURL=`/${newgame.split('Server')[0]}Connect?ID=${forked.room}`
			forked.URL=forkedURL
			socket.emit('forward to room',forkedURL)
			
			//load game files

			allforked[forked.room]=forked
			activeGames=[]
			for(game in allforked){activeGames.push({name:game,URL:allforked[game].URL})}
		}
    });
    socket.on('test',()=>{console.log('tested parent')});
    //socket.on('pass2game',(name,gamecomand)=>{})
});

function message(socket, message, color){
	var messageObj = {
		data: "" + message,
		color: color
	};
	socket.emit('message',JSON.stringify(messageObj));
}

app.use('/',express.static('./Lobby'))
//app.use('/test',express.static('./testConnection'))
app.use('/spoonsConnect',express.static('./htmlSpoons'))
var spoonsConnect=io.of('/spoonsConnect/').on('connection',function(socket){
	//join room
	socket.userData={}
	let roomname=socket.conn.request._query.ID
	console.log(__line, "spoonsConnect Connection with client " + socket.id +" established in room: "+roomname);
	socket.join(roomname)
	socket.emit('getOldID',(data)=>{
		console.log('this is data ',data)
		let gameID=IDs.socketsIDs[data.ID]
		console.log('current IDs ',IDs)
		console.log('gameID',gameID)
		//console.log('allforked',allforked)
		if(gameID!=undefined){
			console.log('not undefined gameID',gameID)
			IDs.gameIDs[gameID]=socket.id
			IDs.socketsIDs[socket.id]=gameID
			delete IDs.socketsIDs[data.ID]
			console.log('current clients ',allClients)
			socket.userData=allClients[gameID]
			//console.log('this socket userData ',socket.userData)
			socket.userData.childProcessName=roomname
			socket.userData.userName=data.name
			allClients[socket.userData.myIDinGame].childProcessName=roomname
			allClients[socket.userData.myIDinGame].userName=data.name
			console.log('this socket userData ',socket.userData)
			if(allforked[socket.userData.childProcessName]!=undefined){
				let disconnectedIndex=allforked[socket.userData.childProcessName].disconnectedPlayers.indexOf(socket.userData.myIDinGame)
				if(disconnectedIndex!=-1){
					allforked[socket.userData.childProcessName].disconnectedPlayers.splice(disconnectedIndex,1)
					message(spoonsConnect.in(roomname),''+allClients[socket.userData.myIDinGame].userName+' has returned',serverColor)
				}
				socket.on('gameCommands',(message2server)=>{
					console.log('sending comand to ',socket.userData.childProcessName)
					message2server.ID=socket.userData.myIDinGame
					allforked[socket.userData.childProcessName].send(message2server)
				});
				socket.on("disconnect",function() {
					console.log(__line,"disconnected: " + socket.userData.userName + ": " + socket.id);
					if (allforked[socket.userData.childProcessName]!=undefined){
						let room=socket.userData.childProcessName
						message( socket.to(room), "" + socket.userData.userName + " has left.", serverColor);
						message( socket.to(room), "Type 'kick' to kick disconnected players", serverColor);
						allforked[socket.userData.childProcessName].disconnectedPlayers.push(socket.userData.myIDinGame)
					}else{spoonsConnect.in(roomname).emit('forward to room','/')}
				});
			}else{spoonsConnect.in(roomname).emit('forward to room','/')}
		}else{spoonsConnect.in(roomname).emit('forward to room','/')}
	})
	socket.on('test',()=>{console.log('test')})
	socket.on("userName", function(userName) {
		let oldName=socket.userData.userName
        socket.userData.userName = userName;
		allClients[socket.userData.myIDinGame].userName=userName
        console.log(__line,"user changed name: " + socket.userData.userName);
		message(spoonsConnect.in(socket.userData.childProcessName), "" + oldName + " has changed name to "+socket.userData.userName, serverColor);
        if(allforked[socket.userData.childProcessName]!=undefined){
			let message2server={command:'addPlayer',ID:socket.userData.myIDinGame}
			allforked[socket.userData.childProcessName].send(message2server)
		}
		//updateUsers();
    });
	socket.on("message",function(data) {
        /*This event is triggered at the server side when client sends the data using socket.send() method */
        let room=socket.userData.childProcessName
		data = JSON.parse(data);
        console.log(__line, "data: ", data);
        /*Printing the data */
		message( socket, "You: " + data.message, chatColor);
		message( socket.to(room), "" + socket.userData.userName + ": " + data.message, chatColor);
        if(data.message === "end") {
            if(allforked[socket.userData.childProcessName]!=undefined){
				console.log(__line,''+socket.userData.username+" forced end");
				let message2server={command:'end',ID:socket.userData.myIDinGame}
				allforked[socket.userData.childProcessName].send(message2server)
			}
        } else if(data.message.toLowerCase() === "kick"){
			console.log(__line, "clearing players");
			if(allforked[socket.userData.childProcessName]!=undefined){
				for(player of allforked[socket.userData.childProcessName].disconnectedPlayers){
					console.log(__line,"removing "+allClients[player].userName+' ID of: '+player);
					let message2server={command:'removePlayer',ID:player}
					allforked[socket.userData.childProcessName].send(message2server)
				}
			}
		}
        /*Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side*/
    });
})

app.use('/rageConnect',express.static('./htmlRage'))
var rageConnect=io.of('/rageConnect/').on('connection',function(socket){
	//join room
	socket.userData={}
	let roomname=socket.conn.request._query.ID
	console.log(__line, "rageConnect Connection with client " + socket.id +" established in room: "+roomname);
	socket.join(roomname)
	socket.emit('getOldID',(data)=>{
		console.log('this is data ',data)
		let gameID=IDs.socketsIDs[data.ID]
		console.log('current IDs ',IDs)
		console.log('gameID',gameID)
		//console.log('allforked',allforked)
		if(gameID!=undefined){
			console.log('not undefined gameID',gameID)
			IDs.gameIDs[gameID]=socket.id
			IDs.socketsIDs[socket.id]=gameID
			delete IDs.socketsIDs[data.ID]
			console.log('current clients ',allClients)
			socket.userData=allClients[gameID]
			//console.log('this socket userData ',socket.userData)
			socket.userData.childProcessName=roomname
			socket.userData.userName=data.name
			allClients[socket.userData.myIDinGame].childProcessName=roomname
			allClients[socket.userData.myIDinGame].userName=data.name
			console.log('this socket userData ',socket.userData)
			if(allforked[socket.userData.childProcessName]!=undefined){
				let disconnectedIndex=allforked[socket.userData.childProcessName].disconnectedPlayers.indexOf(socket.userData.myIDinGame)
				if(disconnectedIndex!=-1){
					allforked[socket.userData.childProcessName].disconnectedPlayers.splice(disconnectedIndex,1)
					message(rageConnect.in(roomname),''+allClients[socket.userData.myIDinGame].userName+' has returned',serverColor)
				}
				socket.on('gameCommands',(message2server)=>{
					console.log('sending comand to ',socket.userData.childProcessName)
					message2server.ID=socket.userData.myIDinGame
					allforked[socket.userData.childProcessName].send(message2server)
				});
				socket.on("disconnect",function() {
					console.log(__line,"disconnected: " + socket.userData.userName + ": " + socket.id);
					if (allforked[socket.userData.childProcessName]!=undefined){
						let room=socket.userData.childProcessName
						message( socket.to(room), "" + socket.userData.userName + " has left.", serverColor);
						message( socket.to(room), "Type 'kick' to kick disconnected players", serverColor);
						allforked[socket.userData.childProcessName].disconnectedPlayers.push(socket.userData.myIDinGame)
					}else{rageConnect.in(roomname).emit('forward to room','/')}
				});
			}else{rageConnect.in(roomname).emit('forward to room','/')}
		}else{rageConnect.in(roomname).emit('forward to room','/')}
	})
	socket.on('test',()=>{console.log('test')})
	socket.on("userName", function(userName) {
		let oldName=socket.userData.userName
        socket.userData.userName = userName;
		allClients[socket.userData.myIDinGame].userName=userName
        console.log(__line,"user changed name: " + socket.userData.userName);
		message(rageConnect.in(socket.userData.childProcessName), "" + oldName + " has channged name to "+socket.userData.userName, serverColor);
        if(allforked[socket.userData.childProcessName]!=undefined){
			let message2server={command:'userName',ID:socket.userData.myIDinGame,data:userName}
			allforked[socket.userData.childProcessName].send(message2server)
		}
		//updateUsers();
    });
	socket.on("message",function(data) {
        /*This event is triggered at the server side when client sends the data using socket.send() method */
        let room=socket.userData.childProcessName
		data = JSON.parse(data);
        console.log(__line, "data: ", data);
        /*Printing the data */
		message( socket, "You: " + data.message, chatColor);
		message( socket.to(room), "" + socket.userData.userName + ": " + data.message, chatColor);
        if(data.message === "end") {
            if(allforked[socket.userData.childProcessName]!=undefined){
				console.log(__line,''+socket.userData.username+" forced end");
				let message2server={command:'end',ID:socket.userData.myIDinGame}
				allforked[socket.userData.childProcessName].send(message2server)
			}
        } else if(data.message.toLowerCase() === "kick"){
			console.log(__line, "clearing players");
			if(allforked[socket.userData.childProcessName]!=undefined){
				for(player of allforked[socket.userData.childProcessName].disconnectedPlayers){
					console.log(__line,"removing "+allClients[player].userName+' ID of: '+player);
					let message2server={command:'removePlayer',ID:player}
					allforked[socket.userData.childProcessName].send(message2server)
				}
			}
		}
        /*Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side*/
    });
})

app.use('/QuintoConnect',express.static('./htmlQuinto'))
var quintoConnect=io.of('/quintoConnect/').on('connection',function(socket){
	//join room
	socket.userData={}
	let roomname=socket.conn.request._query.ID
	console.log(__line, "quintoConnect with client " + socket.id +" established in room: "+roomname);
	socket.join(roomname)
	socket.emit('getOldID',(data)=>{
		console.log('this is data ',data)
		let gameID=IDs.socketsIDs[data.ID]
		console.log('current IDs ',IDs)
		console.log('gameID',gameID)
		//console.log('allforked',allforked)
		if(gameID!=undefined){
			console.log('not undefined gameID',gameID)
			IDs.gameIDs[gameID]=socket.id
			IDs.socketsIDs[socket.id]=gameID
			delete IDs.socketsIDs[data.ID]
			console.log('current clients ',allClients)
			socket.userData=allClients[gameID]
			//console.log('this socket userData ',socket.userData)
			socket.userData.childProcessName=roomname
			socket.userData.userName=data.name
			allClients[socket.userData.myIDinGame].childProcessName=roomname
			allClients[socket.userData.myIDinGame].userName=data.name
			console.log('this socket userData ',socket.userData)
			if(allforked[socket.userData.childProcessName]!=undefined){
				let disconnectedIndex=allforked[socket.userData.childProcessName].disconnectedPlayers.indexOf(socket.userData.myIDinGame)
				if(disconnectedIndex!=-1){
					allforked[socket.userData.childProcessName].disconnectedPlayers.splice(disconnectedIndex,1)
					message(quintoConnect.in(roomname),''+allClients[socket.userData.myIDinGame].userName+' has returned',serverColor)
				}
				socket.on('gameCommands',(message2server)=>{
					console.log('sending comand to ',socket.userData.childProcessName)
					message2server.ID=socket.userData.myIDinGame
					allforked[socket.userData.childProcessName].send(message2server)
				});
				socket.on("disconnect",function() {
					console.log(__line,"disconnected: " + socket.userData.userName + ": " + socket.id);
					if (allforked[socket.userData.childProcessName]!=undefined){
						let room=socket.userData.childProcessName
						message( socket.to(room), "" + socket.userData.userName + " has left.", serverColor);
						message( socket.to(room), "Type 'kick' to kick disconnected players", serverColor);
						allforked[socket.userData.childProcessName].disconnectedPlayers.push(socket.userData.myIDinGame)
					}else{quintoConnect.in(roomname).emit('forward to room','/')}
				});
			}else{quintoConnect.in(roomname).emit('forward to room','/')}
		}else{quintoConnect.in(roomname).emit('forward to room','/')}
	})
	socket.on('test',()=>{console.log('test')})
	socket.on("userName", function(userName) {
		let oldName=socket.userData.userName
        socket.userData.userName = userName;
		allClients[socket.userData.myIDinGame].userName=userName
        console.log(__line,"user changed name: " + socket.userData.userName);
		message(quintoConnect.in(socket.userData.childProcessName), "" + oldName + " has channged name to "+socket.userData.userName, serverColor);
        if(allforked[socket.userData.childProcessName]!=undefined){
			let message2server={command:'userName',ID:socket.userData.myIDinGame,data:userName}
			allforked[socket.userData.childProcessName].send(message2server)
		}
		//updateUsers();
    });
	socket.on("message",function(data) {
        //This event is triggered at the server side when client sends the data using socket.send() method 
        let room=socket.userData.childProcessName
		data = JSON.parse(data);
        console.log(__line, "data: ", data);
        //Printing the data 
		message( socket, "You: " + data.message, chatColor);
		message( socket.to(room), "" + socket.userData.userName + ": " + data.message, chatColor);
        if(data.message === "end") {
            if(allforked[socket.userData.childProcessName]!=undefined){
				console.log(__line,''+socket.userData.username+" forced end");
				let message2server={command:'end',ID:socket.userData.myIDinGame}
				allforked[socket.userData.childProcessName].send(message2server)
			}
        } else if(data.message.toLowerCase() === "kick"){
			console.log(__line, "clearing players");
			if(allforked[socket.userData.childProcessName]!=undefined){
				for(player of allforked[socket.userData.childProcessName].disconnectedPlayers){
					console.log(__line,"removing "+allClients[player].userName+' ID of: '+player);
					let message2server={command:'removePlayer',ID:player}
					allforked[socket.userData.childProcessName].send(message2server)
				}
			}
		}
        //Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side
    });
})

app.use('/PitConnect',express.static('./htmlPit'))
var pitConnect=io.of('/pitConnect/').on('connection',function(socket){
	//join room
	socket.userData={}
	let roomname=socket.conn.request._query.ID
	console.log(__line, "pitConnect with client " + socket.id +" established in room: "+roomname);
	socket.join(roomname)
	socket.emit('getOldID',(data)=>{
		console.log('this is data ',data)
		let gameID=IDs.socketsIDs[data.ID]
		console.log('current IDs ',IDs)
		console.log('gameID',gameID)
		//console.log('allforked',allforked)
		if(gameID!=undefined){
			console.log('not undefined gameID',gameID)
			IDs.gameIDs[gameID]=socket.id
			IDs.socketsIDs[socket.id]=gameID
			delete IDs.socketsIDs[data.ID]
			console.log('current clients ',allClients)
			socket.userData=allClients[gameID]
			//console.log('this socket userData ',socket.userData)
			socket.userData.childProcessName=roomname
			socket.userData.userName=data.name
			allClients[socket.userData.myIDinGame].childProcessName=roomname
			allClients[socket.userData.myIDinGame].userName=data.name
			console.log('this socket userData ',socket.userData)
			if(allforked[socket.userData.childProcessName]!=undefined){
				let disconnectedIndex=allforked[socket.userData.childProcessName].disconnectedPlayers.indexOf(socket.userData.myIDinGame)
				if(disconnectedIndex!=-1){
					allforked[socket.userData.childProcessName].disconnectedPlayers.splice(disconnectedIndex,1)
					message(pitConnect.in(roomname),''+allClients[socket.userData.myIDinGame].userName+' has returned',serverColor)
				}
				socket.on('gameCommands',(message2server)=>{
					console.log('sending comand to ',socket.userData.childProcessName)
					message2server.ID=socket.userData.myIDinGame
					allforked[socket.userData.childProcessName].send(message2server)
				});
				socket.on("disconnect",function() {
					console.log(__line,"disconnected: " + socket.userData.userName + ": " + socket.id);
					if (allforked[socket.userData.childProcessName]!=undefined){
						let room=socket.userData.childProcessName
						message( socket.to(room), "" + socket.userData.userName + " has left.", serverColor);
						message( socket.to(room), "Type 'kick' to kick disconnected players", serverColor);
						allforked[socket.userData.childProcessName].disconnectedPlayers.push(socket.userData.myIDinGame)
					}else{pitConnect.in(roomname).emit('forward to room','/')}
				});
			}else{pitConnect.in(roomname).emit('forward to room','/')}
		}else{pitConnect.in(roomname).emit('forward to room','/')}
	})
	socket.on('test',()=>{console.log('test')})
	socket.on("userName", function(userName) {
		let oldName=socket.userData.userName
        socket.userData.userName = userName;
		allClients[socket.userData.myIDinGame].userName=userName
        console.log(__line,"user changed name: " + socket.userData.userName);
		message(pitConnect.in(socket.userData.childProcessName), "" + oldName + " has channged name to "+socket.userData.userName, serverColor);
        if(allforked[socket.userData.childProcessName]!=undefined){
			let message2server={command:'userName',ID:socket.userData.myIDinGame,data:userName}
			allforked[socket.userData.childProcessName].send(message2server)
		}
		//updateUsers();
    });
	socket.on("message",function(data) {
        //This event is triggered at the server side when client sends the data using socket.send() method 
        let room=socket.userData.childProcessName
		data = JSON.parse(data);
        console.log(__line, "data: ", data);
        //Printing the data 
		message( socket, "You: " + data.message, chatColor);
		message( socket.to(room), "" + socket.userData.userName + ": " + data.message, chatColor);
        if(data.message === "end") {
            if(allforked[socket.userData.childProcessName]!=undefined){
				console.log(__line,''+socket.userData.username+" forced end");
				let message2server={command:'end',ID:socket.userData.myIDinGame}
				allforked[socket.userData.childProcessName].send(message2server)
			}
        } else if(data.message.toLowerCase() === "kick"){
			console.log(__line, "clearing players");
			if(allforked[socket.userData.childProcessName]!=undefined){
				for(player of allforked[socket.userData.childProcessName].disconnectedPlayers){
					console.log(__line,"removing "+allClients[player].userName+' ID of: '+player);
					let message2server={command:'removePlayer',ID:player}
					allforked[socket.userData.childProcessName].send(message2server)
				}
			}
		}
        //Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side
    });
})

app.use('/mooseConnect',express.static('./htmlRage'))
var mooseConnect=io.of('/mooseConnect/').on('connection',function(socket){
	//join room
	socket.userData={}
	let roomname=socket.conn.request._query.ID
	console.log(__line, "mooseConnect Connection with client " + socket.id +" established in room: "+roomname);
	socket.join(roomname)
	socket.emit('getOldID',(data)=>{
		console.log('this is data ',data)
		let gameID=IDs.socketsIDs[data.ID]
		console.log('current IDs ',IDs)
		console.log('gameID',gameID)
		//console.log('allforked',allforked)
		if(gameID!=undefined){
			console.log('not undefined gameID',gameID)
			IDs.gameIDs[gameID]=socket.id
			IDs.socketsIDs[socket.id]=gameID
			delete IDs.socketsIDs[data.ID]
			console.log('current clients ',allClients)
			socket.userData=allClients[gameID]
			//console.log('this socket userData ',socket.userData)
			socket.userData.childProcessName=roomname
			socket.userData.userName=data.name
			allClients[socket.userData.myIDinGame].childProcessName=roomname
			allClients[socket.userData.myIDinGame].userName=data.name
			console.log('this socket userData ',socket.userData)
			if(allforked[socket.userData.childProcessName]!=undefined){
				let disconnectedIndex=allforked[socket.userData.childProcessName].disconnectedPlayers.indexOf(socket.userData.myIDinGame)
				if(disconnectedIndex!=-1){
					allforked[socket.userData.childProcessName].disconnectedPlayers.splice(disconnectedIndex,1)
					message(mooseConnect.in(roomname),''+allClients[socket.userData.myIDinGame].userName+' has returned',serverColor)
				}
				socket.on('gameCommands',(message2server)=>{
					console.log('sending comand to ',socket.userData.childProcessName)
					message2server.ID=socket.userData.myIDinGame
					allforked[socket.userData.childProcessName].send(message2server)
				});
				socket.on("disconnect",function() {
					console.log(__line,"disconnected: " + socket.userData.userName + ": " + socket.id);
					if (allforked[socket.userData.childProcessName]!=undefined){
						let room=socket.userData.childProcessName
						message( socket.to(room), "" + socket.userData.userName + " has left.", serverColor);
						message( socket.to(room), "Type 'kick' to kick disconnected players", serverColor);
						allforked[socket.userData.childProcessName].disconnectedPlayers.push(socket.userData.myIDinGame)
					}else{mooseConnect.in(roomname).emit('forward to room','/')}
				});
			}else{mooseConnect.in(roomname).emit('forward to room','/')}
		}else{mooseConnect.in(roomname).emit('forward to room','/')}
	})
	socket.on('test',()=>{console.log('test')})
	socket.on("userName", function(userName) {
		let oldName=socket.userData.userName
        socket.userData.userName = userName;
		allClients[socket.userData.myIDinGame].userName=userName
        console.log(__line,"user changed name: " + socket.userData.userName);
		message(mooseConnect.in(socket.userData.childProcessName), "" + oldName + " has channged name to "+socket.userData.userName, serverColor);
        if(allforked[socket.userData.childProcessName]!=undefined){
			let message2server={command:'userName',ID:socket.userData.myIDinGame,data:userName}
			allforked[socket.userData.childProcessName].send(message2server)
		}
		//updateUsers();
    });
	socket.on("message",function(data) {
        /*This event is triggered at the server side when client sends the data using socket.send() method */
        let room=socket.userData.childProcessName
		data = JSON.parse(data);
        console.log(__line, "data: ", data);
        /*Printing the data */
		message( socket, "You: " + data.message, chatColor);
		message( socket.to(room), "" + socket.userData.userName + ": " + data.message, chatColor);
        if(data.message === "end") {
            if(allforked[socket.userData.childProcessName]!=undefined){
				console.log(__line,''+socket.userData.username+" forced end");
				let message2server={command:'end',ID:socket.userData.myIDinGame}
				allforked[socket.userData.childProcessName].send(message2server)
			}
        } else if(data.message.toLowerCase() === "kick"){
			console.log(__line, "clearing players");
			if(allforked[socket.userData.childProcessName]!=undefined){
				for(player of allforked[socket.userData.childProcessName].disconnectedPlayers){
					console.log(__line,"removing "+allClients[player].userName+' ID of: '+player);
					let message2server={command:'removePlayer',ID:player}
					allforked[socket.userData.childProcessName].send(message2server)
				}
			}
		}
        /*Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side*/
    });
})

//const second = fork('child.js');
/*for(i=0;i<2;i++){
	let forked = fork('child.js');
	forked.on('message', (msg) => {
		console.log('Message from child:', msg);
	});
	allforked.push(forked)
}
console.log(allforked)
*/
//allforked[0].send({ port: 'world1' });
//allforked[1].send({ port: 'world2' });
//second.send({ port: 'rage' });



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
var stdin = process.openStdin();
stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
	var input = d.toString().trim();
    console.log('you entered: [' + input + ']');
	if(input.includes('$') && !input.includes('$$')){
		sinput=input.split('$')
		console.log(sinput)
		if(sinput.length==2){
			if(sinput[1] in allforked){
				console.log('feching '+sinput[0]+' from '+sinput[1])
				allforked[sinput[1]].send({debug:true,input:sinput[0]})
			}else{console.log(''+sinput[1]+ ' is not in allforked')}
		}else{console.log('input has been broken into to many pieces',sinput)}
	}else{
		try{
			eval("console.log("+input+")");
		} catch (err) {
			console.log("invalid command");
		}
	}
  });