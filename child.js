

process.on('message', (msg) => {
  console.log('Message from parent:', msg);
  if(msg.port!=undefined){
    process.send({ counter: counter++ });
  }
  //
});

let counter = 0;

process.send({ counter: counter++ })



