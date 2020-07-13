/*const { exec } = require('child_process');

const ls = exec(`start powershell  "&" node rageServer.js`, function (error, stdout, stderr) {
  if (error) {
    console.log(error.stack);
    console.log('Error code: '+error.code);
    console.log('Signal received: '+error.signal);
  }
  console.log('Child Process STDOUT: '+stdout);
  console.log('Child Process STDERR: '+stderr);
});

ls.on('exit', function (code) {
  console.log('Child process exited with exit code '+code);
});*/

var express = require("express");
var http = require("http");
var app = express();
app.use(express.static("./htmlmaster"));
var socket =433;
var server = http.createServer(app).listen(socket,"0.0.0.0",511,function(){console.log(__line,"Server connected to socket: "+socket);});//Server listens on the port 8124

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

//allows input from the console
var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
  var input = d.toString().trim();
    console.log('you entered: [' + input + ']');
  try{
    eval("console.log("+input+")");
  } catch (err) {
    console.log("invalid command");
  }
  });