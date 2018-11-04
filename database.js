var global = require('./global.js');
var mysql = require('mysql');


module.exports = {
  start_connection: function () {
    connection_mysql = mysql.createConnection({
      host: "localhost",
      user: "crmpbx",
      password: "crmpbx",
      database: "crmpbx"
    });

    connection_mysql.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      //Create database and tables
      connection_mysql.query("CREATE DATABASE crmpbx", function (err, result) {
        if (err) console.log(err);
        else console.log("Database created.");

        var sql = "CREATE TABLE calls (id INTEGER(20) AUTO_INCREMENT PRIMARY KEY, \
                                      hash_call_id VARCHAR(255), \
                                      caller VARCHAR(255), \
                                      called VARCHAR(255), \
                                      type VARCHAR(20), \
                                      status VARCHAR(20), \
                                      calldata JSON)";
        connection_mysql.query(sql, function (err, result) {
          if (err) console.log(err);
          else console.log("Table created");

          connection_mysql.query("SELECT * FROM calls", function (err, result) {
            if (err) throw err;
            console.log("Result: " + result);
          });
        });
      });
    });

  }
}

