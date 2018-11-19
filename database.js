var global = require('./global.js');
var mysql = require('mysql');
var moment = require('moment');
const hash = require('crypto').createHash;
const { StringDecoder } = require('string_decoder');

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
      if (err) { console.log(err) };
      console.log("Connected!");

      //Create database and tables
      global.connection_mysql.query("CREATE DATABASE crmpbx", function (err, result) {
        if (err) console.log("Database existing or connection error");
        else console.log("Database created.");

        var sql = "CREATE TABLE calls (id INTEGER(10) AUTO_INCREMENT PRIMARY KEY, \
                                      hash_call_id VARCHAR(100), \
                                      caller VARCHAR(30), \
                                      called VARCHAR(30), \
                                      dst VARCHAR(30), \
                                      type VARCHAR(30), \
                                      status VARCHAR(30), \
                                      begin DATETIME, \
                                      duration INTEGER(10), \
                                      calldata BLOB,CHECK (JSON_VALID(calldata)), UNIQUE (hash_call_id))";
        global.connection_mysql.query(sql, function (err, result) {
          if (err) console.log("Table existing or connection error");
          else console.log("Table created");

          /* Try to get SQL query from database
          global.connection_mysql.query("SELECT * FROM calls", function (err, result) {
            if (err) console.log(err); 
          }); */
        });
      });
    });
  },
  search_calls: function (start_date, end_date, call_type, internal_phone_number, external_phone_number, customer_contact, call_status, callback) {

    start_date = moment(start_date, 'DD/MM/YYYY').toDate().toISOString();
    end_date = moment(end_date, 'DD/MM/YYYY').toDate().toISOString();

    var sql = "SELECT * FROM calls WHERE(";
    if (start_date) sql += "begin>'" + start_date + "'";
    if (end_date) sql += " AND begin<'" + end_date + "'";
    if (internal_phone_number) sql += " AND called='" + internal_phone_number + "'";
    if (call_type) sql += " AND type='" + call_type + "'";
    if (call_status) sql += " AND status='" + call_status + "'";
    if (customer_contact) sql += " AND caller='" + customer_contact + "'";
    sql += ");"
    console.log(sql);
    global.connection_mysql.query(sql, function (err, result) {
      if (err) { console.log("Search error"); }
      else console.log("Search done: " + sql);
      callback(result);
    });
  },
  insert_call: function (call, type) {
    //make unique identifier for call
    var str_obj_call = JSON.stringify(call);
    var hash_call_id = hash("sha1").update(JSON.stringify(str_obj_call)).digest("base64");
    var sql_search_call="SELECT * FROM calls WHERE (hash_call_id=\'" + hash_call_id + "');";
    //find if call exists
    global.connection_mysql.query(sql_search_call, function (err, result) {
      if (err) {
        var call_flow = call.callflow;
        //extract external number    
        if (call_flow && call_flow.length)
          call.dst = call_flow[0].dst
        var sql = "INSERT INTO calls (hash_call_id,caller,called,dst,type,status,begin,duration,calldata) VALUES ("
          + "'" + hash_call_id + "',"
          + "'" + call.caller + "',"
          + "'" + call.called + "',"
          + "'" + call.dst + "',"
          + "'" + type + "',"
          + "'" + call.stato + "',"
          + "'" + call.begin + "',"
          + "'" + call.duration + "',"
          + "'" + str_obj_call + "')";
        global.connection_mysql.query(sql, function (err, result) {
          if (err) { console.log(err); }
          else console.log("Inserted call " + call.begin + "-" + call.caller + "->" + call.called + "---" + type + "---" + call.stato);
        });
      }
      else {console.log("Call exists "+hash_call_id);}
    });

  }
}

