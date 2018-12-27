var global = require('./global.js');
var mysql = require('mysql');
var moment = require('moment');
const hash = require('crypto').createHash;
var config = require('./config.js').config;

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

  //Standard search call
  search_calls_normal: function (start_date, end_date, call_type, internal_phone_number, external_phone_number, customer_contact, call_status, callback) {
    var final_result = [];
    //Read italian localized format from UI
    start_date = moment(start_date, 'DD/MM/YYYY HH:mm:ss');
    end_date = moment(end_date, 'DD/MM/YYYY HH:mm:ss');
    //Format string for database query
    start_date = moment(start_date).format('YYYY-MM-DD HH:mm:ss');
    end_date = moment(end_date).format('YYYY-MM-DD HH:mm:ss');

    var sql = "SELECT * FROM calls WHERE(";
    if (start_date) sql += "begin>='" + start_date + "'";
    if (end_date) sql += " AND begin<='" + end_date + "'";
    if (internal_phone_number) sql += " AND called='" + internal_phone_number + "'";
    if (call_type) sql += " AND type='" + call_type + "'";
    if (call_status) sql += " AND status='" + call_status + "'";
    if (customer_contact) sql += " AND caller='" + customer_contact + "'";
    sql += ") ORDER BY BEGIN DESC;"
    console.log(sql);
    global.connection_mysql.query(sql, function (err, result) {
      if (err) { console.log("Search error"); }
      else console.log("Search done: " + sql);
      //Prevede le ricerche nulle.
      if(result.length==0) callback(result);

      //Evita i duplicati         
      result.forEach(function (element, index) {
        //Parse callflow
        element = parse_call_flow_from_database(element);
        var b_exists = false;
        final_result.forEach(function (el, i) {
          if (el.caller === element.caller) {//accoda gli orari di chiamata
            if (!el.other_calls) el.other_calls = [];
            if (el.other_calls)
              el.other_calls.push(element);
            b_exists = true;
          }
        });
        var qres = status_remap_for_queue(element);
        var true_status = qres.computed_status;
        if (!b_exists && true_status === call_status)
          final_result.push(element); //inserisce nel risultato finale la chiamata ricercata tra quelle non risposte o occupate        
        if (index === result.length - 1)
          callback(final_result);
      }); //Evita i duplicati    
    });
  },
  //Double filter answer
  double_filter_answer: function (start_date, end_date, call_type, internal_phone_number, external_phone_number, customer_contact, call_status, callback) {
    //Read italian localized format from UI
    start_date = moment(start_date, 'DD/MM/YYYY HH:mm:ss');
    end_date = moment(end_date, 'DD/MM/YYYY HH:mm:ss');
    //Format string for database query
    start_date = moment(start_date).format('YYYY-MM-DD HH:mm:ss');
    end_date = moment(end_date).format('YYYY-MM-DD HH:mm:ss');
    //ricarca tutte le chiamate indifferentemente per poi selezionare solo quelle che
    // effettivamente hanno avuto risposta
    var sql = "SELECT * FROM calls WHERE(";
    if (start_date) sql += "begin>='" + start_date + "'";
    if (end_date) sql += " AND begin<='" + end_date + "'";
    if (internal_phone_number) sql += " AND called='" + internal_phone_number + "'";
    if (call_type) sql += " AND type='" + call_type + "'";
    //if (call_status) sql += " AND status='" + call_status + "'";//Ricerca tutte le chiamate
    if (customer_contact) sql += " AND caller='" + customer_contact + "'";
    sql += ") ORDER BY BEGIN DESC;"
    console.log(sql);
    global.connection_mysql.query(sql, function (err, result) {
      if (err) { console.log("Search error"); }
      else console.log("Search done: " + sql);

      //Esce se la ricerca è vuota
      if (result.length === 0) callback(final_result);

      var final_result = [];
      result.forEach(function (element, index) {
        start_date = moment(element.begin).format('YYYY-MM-DD HH:mm:ss'); //Inizia la ricerca dalla ricezione della chiamata occupata o persa        
        //cerca le chiamate risposte e correlate con la presente
        var sql2 = "SELECT * FROM calls WHERE(status='ANSWERED'"
        sql2 += " AND ((caller='" + element.caller + "' AND type ='incoming')";
        sql2 += " OR (called='" + element.caller + "' AND type ='outgoing'))";
        if (start_date) sql2 += " AND begin>='" + start_date + "'";
        if (end_date) sql2 += " AND begin<='" + end_date + "'";
        sql2 += ");";

        global.connection_mysql.query(sql2, function (err, result_correlate) {
          //Se trova chiamate in ingresso o in uscita correlate le inserisce come
          //campo ausiliario nella chiamata principale, quella che apre il contatto 
          //giornaliero.
          if (result_correlate && result_correlate.length > 0) {
            Object.assign(result[index], { "conversations": result_correlate }); //inserisce la chiamata nell'elenco delle correlate
            if (check_answer_queue_related(result_correlate) === "ANSWERED") {
              //Evita i duplicati
              var b_exists = false;
              final_result.forEach(function (el, i) {
                if (el.caller === result[index].caller) {//accoda le successive chiamate
                  if (!el.other_calls) el.other_calls = [];
                  if (el.other_calls) el.other_calls.push(result[index]);
                  b_exists = true;
                }
              });
              if (!b_exists) final_result.push(result[index]); //inserisce nel risultato finale la chiamata ricercata tra quelle non risposte o occupate
            }
            //Evita i duplicati e gestisce la coda
          }
          if (index === result.length - 1)
            callback(final_result);
        });
      });
    });
  },
  //Double filter answer
  double_filter_noanswer: function (start_date, end_date, call_type, internal_phone_number, external_phone_number, customer_contact, call_status, callback) {
    //Read italian localized format from UI
    start_date = moment(start_date, 'DD/MM/YYYY HH:mm:ss');
    end_date = moment(end_date, 'DD/MM/YYYY HH:mm:ss');
    //Format string for database query
    start_date = moment(start_date).format('YYYY-MM-DD HH:mm:ss');
    end_date = moment(end_date).format('YYYY-MM-DD HH:mm:ss');

    var sql = "SELECT * FROM calls WHERE(status<>'ANSWERED' ";
    if (start_date) sql += " AND begin>='" + start_date + "'";
    if (end_date) sql += " AND begin<='" + end_date + "'";
    if (internal_phone_number) sql += " AND called='" + internal_phone_number + "'";
    if (call_type) sql += " AND type='" + call_type + "'";
    //if (call_status) sql += " AND status='" + call_status + "'";//ricarca tutte le chiamate del periodo
    //if (customer_contact) sql += " AND caller='" + customer_contact + "'";
    sql += ") ORDER BY BEGIN DESC;"
    console.log(sql);
    global.connection_mysql.query(sql, function (err, result) {
      if (err) { console.log("Search error"); }
      else {
        console.log("Search done: " + sql);
        console.log("Ricerca chiamate non risposte ed occupate. Risultati n. " + result.length);
      }

      //Esce se la ricerca è vuota
      if (result.length === 0) callback(final_result);


      //Eliminazione chiamate già risposte      
      var final_result = [];
      result.forEach(function (element, index) {
        start_date = moment(element.begin).format('YYYY-MM-DD HH:mm:ss'); //Inizia la ricerca dalla ricezione della chiamata occupata o persa
        //cerca le chiamate risposte correlate a quelle occupate e non risposte e le elimina dal risultato finale
        var sql2 = "SELECT * FROM calls WHERE(status='ANSWERED' "
        if (element.caller) sql2 += " AND ((caller='" + element.caller + "' AND type ='incoming')";
        if (element.caller) sql2 += " OR (  called='" + element.caller + "' AND type ='outgoing'))";
        if (start_date) sql2 += " AND begin>='" + start_date + "'";
        if (end_date) sql2 += " AND begin<='" + end_date + "'";
        sql2 += ");";
        console.log(sql2);
        global.connection_mysql.query(sql2, function (err, result_correlate) {
          if (err) console.log(err);
          if (!result_correlate || result_correlate.length == 0) { //se non trova la correlazione le inserisce nell'elenco delle non risposte.
            //Evita i duplicati
            var b_exists = false;
            final_result.forEach(function (el, i) {
              if (el.caller === result[index].caller) {//accoda gli orari di chiamata
                if (!el.other_calls) el.other_calls = [];
                if (el.other_calls) el.other_calls.push(result[index]);
                b_exists = true;
              }
            });
            if (!b_exists) final_result.push(result[index]); //inserisce nel risultato finale la chiamata ricercata tra quelle non risposte o occupate
            //Evita i duplicati          
          }
          if (result_correlate && result_correlate.length > 0) { //Log correlazioni
            console.log("Trovata chiamata correlata con: " + result_correlate.length + "-" + element.begin + "-" + element.caller + ">" + element.called + "-" + element.status);
            for (j = 0; j < result_correlate.length; j++) console.log(result_correlate[j].begin + "-" + result_correlate[j].caller + "->" + result_correlate[j].called + "--" + result_correlate[j].status);
          }


          if (index === result.length - 1) callback(final_result); //chiama la callback a fine ciclo
        });
      });
    });
  },

  //Double filter answer
  double_filter_busy: function (start_date, end_date, call_type, internal_phone_number, external_phone_number, customer_contact, call_status, callback) {
    //Read italian localized format from UI
    start_date = moment(start_date, 'DD/MM/YYYY HH:mm:ss');
    end_date = moment(end_date, 'DD/MM/YYYY HH:mm:ss');
    //Format string for database query
    start_date = moment(start_date).format('YYYY-MM-DD HH:mm:ss');
    end_date = moment(end_date).format('YYYY-MM-DD HH:mm:ss');

    var sql = "SELECT * FROM calls WHERE(status='BUSY' ";
    if (start_date) sql += " AND begin>='" + start_date + "'";
    if (end_date) sql += " AND begin<='" + end_date + "'";
    if (internal_phone_number) sql += " AND called='" + internal_phone_number + "'";
    if (call_type) sql += " AND type='" + call_type + "'";
    //if (call_status) sql += " AND status='" + call_status + "'";//ricarca tutte le chiamate del periodo
    //if (customer_contact) sql += " AND caller='" + customer_contact + "'";
    sql += ") ORDER BY BEGIN DESC;"
    console.log(sql);
    global.connection_mysql.query(sql, function (err, result) {
      if (err) { console.log("Search error"); }
      else {
        console.log("Search done: " + sql);
        console.log("Ricerca chiamate non risposte ed occupate. Risultati n. " + result.length);
      }

      //Esce se la ricerca è vuota
      if (result.length === 0) callback(final_result);

      //Eliminazione chiamate già risposte      
      var final_result = [];
      result.forEach(function (element, index) {
        start_date = moment(element.begin).format('YYYY-MM-DD HH:mm:ss'); //Inizia la ricerca dalla ricezione della chiamata occupata o persa
        //cerca le chiamate risposte correlate a quelle occupate e non risposte e le elimina dal risultato finale
        var sql2 = "SELECT * FROM calls WHERE(status='ANSWERED' "
        if (element.caller) sql2 += " AND ((caller='" + element.caller + "' AND type ='incoming')";
        if (element.caller) sql2 += " OR (  called='" + element.caller + "' AND type ='outgoing'))";
        if (start_date) sql2 += " AND begin>='" + start_date + "'";
        if (end_date) sql2 += " AND begin<='" + end_date + "'";
        sql2 += ");";
        console.log(sql2);
        global.connection_mysql.query(sql2, function (err, result_correlate) {
          if (result_correlate && result_correlate.length > 0) {
            Object.assign(result[index], { "conversations": result_correlate }); //inserisce la chiamata nell'elenco delle correlate
            final_result.push(result[index]);  // Marca la chiamata come risposta perchè trova la correlazione
          }
          //se non vi sono chiamate con risposta correlate alla presente
          if (!result_correlate || result_correlate.length === 0) {
            //controllo se chiamante non già inserito
            //Evita i duplicati
            var b_exists = false;
            final_result.forEach(function (element, i) {
              if (element.caller === result[index].caller) {//accoda gli orari di chiamata
                element.begin += "<br>" + result[index].begin;
                b_exists = true;
              }
            });
            if (!b_exists) final_result.push(result[index]); //Inserisce nella lista delle occupate ma sono marcate da richiamare (no conversazioni associate)
            //Evita i duplicati
          }

          if (index === result.length - 1)
            callback(final_result);
        });
      });
    });
  },


  insert_call: function (call, type) {
    //make unique identifier for call
    var str_obj_call = JSON.stringify(call);
    //correzione campo con nome italiano se dati scaricati da database
    if (call.stato && !call.status) call.status = call.stato;  //dati provenienti da database    

    var hash_call_id = "";
    if (type === "incoming")
      hash_call_id = hash("md5").update(call.begin + call.caller + call.type + call.status).digest("base64");
    if (type === "outgoing")
      hash_call_id = hash("md5").update(call.begin + call.called + call.type + call.status).digest("base64");


    var sql_search_call = "SELECT * FROM calls WHERE (hash_call_id=\'" + hash_call_id + "');";
    //find if call exists
    global.connection_mysql.query(sql_search_call, function (err, result) {
      //Insert call if doesn't exists in database
      if (result && result.length === 0) {
        var call_flow = call.callflow;
        // Verify status and true dst for incoming call
        if (type === "incoming") {
          var qres = status_remap_for_queue(call);
          call.status = qres.computed_status;
          if (qres.dst && qres.dst !== "")
            call.called = qres.dst;
        }
        //extract external number    
        if (call_flow && call_flow.length)
          call.dst = call_flow[0].dst
        var sql = "INSERT INTO calls (hash_call_id,caller,called,dst,type,status,begin,duration,calldata) VALUES ("
          + "'" + hash_call_id + "',"
          + "'" + call.caller + "',"
          + "'" + call.called + "',"
          + "'" + call.dst + "',"
          + "'" + type + "',"
          + "'" + call.status + "',"
          + "'" + call.begin + "',"
          + "'" + call.duration + "',"
          + "'" + str_obj_call + "')";
        global.connection_mysql.query(sql, function (err, result) {
          if (err) { console.log("Insert error probably duplicate entry. " + call.begin + "-" + call.caller + "->" + call.called + "---" + type + "---" + call.stato); }
          else console.log("Inserted call " + call.begin + "-" + call.caller + "->" + call.called + "---" + type + "---" + call.stato);
        });
      }
      else { console.log("Call exists " + hash_call_id + "---" + call.begin + "-" + call.caller + "->" + call.called + "---" + type + "---" + call.stato); }
    });

  }
}

// controlla nel caso ci siano chiamate risposta da una coda che 
// le stesse siano state servite da un interno
// la funzione lavora su una lista chiamate correlate
// cioè afferenti allo stesso numeto chiamante o chiamato
// NON utilizzare su liste di chiamate non correlate tra loro
function check_answer_queue_related(calls_correlated) {
  var true_state = "NO ANSWER";
  calls_correlated.forEach(function (call, i) {
    //Parse callflow
    call = parse_call_flow_from_database(call);
    if (call.type === "incoming") { //valuta il callflow solo per le chiamate in ingresso
      var qres = status_remap_for_queue(call);
      true_state = qres.computed_status;
      if (true_state === "ANSWERED")
        return true_state;
    }
  });
  return true_state;
}

//gestione delle risposte su una coda
function status_remap_for_queue(call) {
  var res = {};
  var computed_status = "";
  //correzione campo con nome italiano se dati scaricati da database
  if (call.stato && !call.status) call.status = call.stato;  //dati provenienti da database    
  computed_status = call.status;

  var computed_status = call.status; //Il campo stato ANSWERED, ANSWER, BUSY viene controllato con gli interni
  var call_flow = call.callflow;
  var b_internal_ans = false; // diventa vero se risponde un interno
  var true_internal = "";
  if (call_flow)
    call_flow.forEach(function (element, index) {
      var b_dst_internal = is_internal_number(element.dst);
      //Calcola se la chiamata è risposta da un interno o solo da una coda.
      if (b_dst_internal && (call.status === "ANSWERED") && (element.stato === "ANSWERED")) {
        true_internal = element.dst;
        b_internal_ans = true;
      }
    });
  //Correzione del problema delle code le chiamate mese in coda sono marcate risposte ma non è detto
  //Se nel call flow non esistono elementi che hanno dato risposta modifica lo stato della chiamata     
  if (!b_internal_ans)
    res.computed_status = "NO ANSWER";
  if (!b_internal_ans && call.stato === "BUSY")
    res.computed_status = "BUSY";
  if (b_internal_ans) {
    res.computed_status = "ANSWERED";
    res.dst = true_internal;
  }
  return res;
}

function is_internal_number(data) {
  var b = false;
  config.internal_phone_number.forEach(element => {
    if (element.username === data) { b = true; }
  });
  return b;
}

function parse_call_flow_from_database(call) {
  var decoder = new StringDecoder('utf8');
  var call_data = decoder.write(call.calldata);
  call_data_obj = JSON.parse(call_data);
  call.callflow = call_data_obj.callflow;
  return call;
}