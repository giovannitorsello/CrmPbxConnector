var global = require('./global.js');
var mysql = require('mysql');
const hash = require('crypto').createHash;


module.exports = {

  //Open connection and configure database for first use;
  start_connection: function () {
    global.connection_mysql = mysql.createConnection({
      host: "localhost",
      user: "crmpbx",
      password: "crmpbx",
      database: "crmpbx"
    });

    global.connection_mysql.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      //Create database and tables
      global.connection_mysql.query("CREATE DATABASE crmpbx", function (err, result) {
        if (err) console.log(err);
        else console.log("Database created.");

        var sql = "CREATE TABLE calls (id INTEGER(10) AUTO_INCREMENT PRIMARY KEY, \
                                      hash_call_id VARCHAR(100), \
                                      caller VARCHAR(30), \
                                      called VARCHAR(30), \
                                      type VARCHAR(30), \
                                      status VARCHAR(30), \
                                      begin DATE, \
                                      duration INTEGER(10), \
                                      calldata BLOB,CHECK (JSON_VALID(calldata)), UNIQUE (hash_call_id))";
        global.connection_mysql.query(sql, function (err, result) {
          if (err) console.log(err);
          else console.log("Table created");

          global.connection_mysql.query("SELECT * FROM calls", function (err, result) {
            if (err) console.log(err);
            console.log("Result: " + result);
          });
        });
      });
    });
  },

  insert_call: function (call, type) {
    //make unique identifier for call
    var str_obj_call=JSON.stringify(call);
    var hash_call_id = hash("sha1").update(JSON.stringify(str_obj_call)).digest("base64");    
    
    var sql = "INSERT INTO calls (hash_call_id,caller,called,type,status,begin,duration,calldata) VALUES ("
      +"'"+hash_call_id + "',"
      +"'"+call.caller + "'," 
      +"'"+call.called + "'," 
      +"'"+type + "'," 
      +"'"+call.stato + "'," 
      +"'"+call.begin + "',"
      +"'"+call.duration + "',"
      +"'"+str_obj_call + "')";
      global.connection_mysql.query(sql, function (err, result) {
      if (err) {/*console.log(err);*/}
        else console.log("Inserted call "+call.caller+"->"+call.called+"---"+type+"---"+call.stato);
      });
      
  }
}

