var io = require('socket.io-client');
var config = require('./config.js').config;
var database = require('./database.js');

var i_inc_ans = 1, i_out_ans = 1, i_inc_noans = 1, i_out_noans = 1;
        
module.exports = {
    get_pbx_calls_status: function () {
        //Force socket closing to be sure that Timenet server doesn't switch in protected mode
        socket_map.forEach(function callback(soc, internal_phone, Map) {soc.emit("disconnect");soc.close();});

        //empty call and socket lists
        i_inc_ans = 1; i_out_ans = 1; i_inc_noans = 1; i_out_noans = 1;
        outgoing_answered_calls.clear();
        outgoing_noanswered_calls.clear();
        incoming_answered_calls.clear();
        incoming_noanswered_calls.clear();
        socket_map.clear();
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

//Fucntion that manage all socket events
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
            str_date_start = start_date.toFormat("YYYY-MM-DD 00:00:00");
            str_date_end = end_date.toFormat("YYYY-MM-DD 00:00:00");
            var cmd = { "method": "CallLog", "DataStart": str_date_start, "DataEnd": str_date_end };
            console.log(cmd);
            soc.emit('pbx action', cmd);
        }
    });

    soc.on('pbx CallLog', function (data) {
        if (data.result == true) {
            var calls = data.rows;
            calls.forEach(function (call) {
                //Outgoing calls                        
                if (internal_phone_map.has(call.caller)) {
                    database.insert_call(call,"outgoing");
                    if (call.stato == "NO ANSWER") {
                        //console.log("Found not answer outgoing call -> " + call.caller);
                        outgoing_noanswered_calls.set(i_out_noans, call);                    
                        i_out_noans++;
                    }
                    if (call.stato == "ANSWERED") {
                        outgoing_answered_calls.set(i_out_ans, call);
                        i_out_ans++;
                    }
                }
                //Incoming calls
                if (internal_phone_map.has(call.called)) {                    
                    database.insert_call(call,"incoming");
                    if (call.stato == "NO ANSWER") {
                        //console.log("Found not answer incoming call -> " + call.caller);
                        incoming_noanswered_calls.set(i_inc_noans, call);
                        i_inc_noans++;
                    }
                    if (call.stato == "ANSWERED") {
                        incoming_answered_calls.set(i_inc_ans, call);
                        i_inc_ans++;
                    }
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