
function(socket){
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
}

