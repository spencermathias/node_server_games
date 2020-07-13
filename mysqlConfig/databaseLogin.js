var mysql = require('mysql');
var conDB = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "cherrydragonfruit",
  database: "allgames"
});
module.exports = conDB