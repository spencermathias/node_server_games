var tempFunctions={}
var dataFromServer=[]
var dataToServer=[]
var i=0
var socket={
	on:function(name,funct){
		tempFunctions[name]=funct
	},
	emit:function(name,data){
        dataToServer.push({ID:'tempUser',command:name,data:data})
	}
}

function runData(number=i,fromServer=true){
	console.log('running ',dataFromServer[number])
	if(fromServer){
	    tempFunctions[dataFromServer[number].command](dataFromServer[number].data)
		if(dataFromServer[number]){
			i=number+1
		}
	}else{
		MessageIn(dataToServer[number])
	}
}

