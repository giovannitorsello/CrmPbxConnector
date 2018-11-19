var io = require('socket.io-client');
var sleep = require('sleep');

var config = require('./config.js').config;
var database = require('./database.js');

//var i_inc_ans = 1, i_out_ans = 1, i_inc_noans = 1, i_out_noans = 1;

var start_date=null, end_date=null;

module.exports = {
    get_pbx_calls_status: function (start_date_search, end_date_search) {
        //Force socket closing to be sure that Timenet server doesn't switch in protected mode
        socket_map.forEach(function callback(soc, internal_phone, Map) {soc.emit("disconnect");soc.close();});
        socket_map.clear();

        // Set global date range for search in PBX databse
        start_date=start_date_search; end_date=end_date_search;
        
        //Find call list for wach internal number
        config.internal_phone_number.forEach(function callback(internal) {
            var internal_phone=internal.username;
            var password= internal.password;
            console.log("Getting info for: "+internal_phone);
            var socket = io.connect('https://my.cloudpbx.it:30644', { secure: true, rejectUnauthorized: false });
            socket_map.set(internal_phone, socket);
            registerSocketEventListeners(socket, internal_phone,password);
        }); //End iteration forEach between internal_phone maps
    },
    //close socket before exit
    close_all_sockets: function () {
        //Force socket closing to be sure that server doesn't switch in protected mode
        socket_map.forEach(function callback(soc, internal_phone, Map) {
            soc.emit("disconnect");
            soc.close();
        });
    }
}

function is_internal_number(data) {
    var b=false;
    config.internal_phone_number.forEach(element => {             
        if(element.username===data) {b=true;}
    });
    return b;
}

//Function that manage all socket events
function registerSocketEventListeners(soc, internal_phone, password) {
    // Add a connect listener
    soc.on('connect', function () {
        console.log('Connect successful');
        console.log(soc.io.uri);
        console.log("Connected: " + soc.connected);
        soc.emit('user login', {
            username: internal_phone,
            password: password
        }); //this produce user token event                
    });

    soc.on('disconnect', function () {
        console.log('Disconnected');
        console.log(soc.io.uri);
        console.log("Connected: " + soc.connected);
        soc.close();
    });

    soc.on('error', function (err) {
        console.log('Received socket error:');
        console.log(err);
    });

    soc.on('user token', function (data) {
        if (data.result) {
            console.log("Login success for " + data.username);
            token = data.token;
            username = data.username;
            password = data.password;
            str_date_start = start_date.toFormat("YYYY-MM-DD HH:MI:SS");
            str_date_end = end_date.toFormat("YYYY-MM-DD HH:MI:SS");
            var cmd = { "method": "CallLog", "DataStart": str_date_start, "DataEnd": str_date_end };
            console.log(cmd);
            soc.emit('pbx action', cmd);
            sleep.sleep(3); //wait seconds between two pbx query
        }
    });

    soc.on('pbx CallLog', function (data) {
        if (data.result == true) {
            var calls = data.rows;
            calls.forEach(function (call) {
                //Outgoing calls                        
                if (is_internal_number(call.caller)) {                    
                    //Insert only outgoing calls not internal-internal calls
                    if(!(is_internal_number(call.called)))
                        database.insert_call(call,"outgoing");                        
                }
                //Incoming calls
                if (is_internal_number(call.called)) {                    
                    //Insert only outgoing calls not internal-internal calls
                    if(!(is_internal_number(call.caller)))
                        database.insert_call(call,"incoming");                    
                }
                
            });
            soc.emit("disconnect");
            soc.close();
        }
    });

    soc.on('pbx Newstate', function (data) {
        console.log(data);
    });

    soc.on('pbx Hangup', function (data) {
        console.log(data);
    });
}