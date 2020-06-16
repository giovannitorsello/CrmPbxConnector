var io = require('socket.io-client');
var moment = require('moment');

//Read configuration
var config = require('./config.js').readConfigFromFile();

var database = require('./database.js');

//var i_inc_ans = 1, i_out_ans = 1, i_inc_noans = 1, i_out_noans = 1;

var start_date = null, end_date = null;

module.exports = {
    connect_socket_internal_phones: function(callback) {
        //Find call list for wach internal number
        config.internal_phone_number.forEach(function callback(internal) {
            var internal_phone = internal.username;
            var password = internal.password;
            console.log("Getting info for: " + internal_phone);
            var socket = socket_map.get(internal_phone);
            if(socket==null)
            {
                socket=io.connect(config.cloudpbx_api_url, { secure: true, rejectUnauthorized: false });
                socket_map.set(internal_phone, socket);
                registerSocketEventListeners(socket, internal_phone, password);
            }
        }); //End iteration forEach between internal_phone maps
        callback();
    },
    get_pbx_calls_status: function (start_date_search, end_date_search) {
        
        // Set global date range for search in PBX databse
        start_date = start_date_search; end_date = end_date_search;
        if(config.time_format==="UTC"){
            var boolDST=false;
            if( (start_date > new Date(moment(config.date_start_dst,'YYYY-MM-DD'))) &&
                (end_date < new Date(moment(config.date_end_dst,'YYYY-MM-DD')))
             ) boolDST=true;            
            delta_hours=config.timezone;
            if(boolDST) delta_hours+=1;
            //Localize Timezone Hour and minutes call
            var delta_timezone = delta_hours*3600*1000;            
            start_date = new Date(start_date.getTime() + delta_timezone);
            end_date = new Date(end_date.getTime() + delta_timezone);
        }
        console.log("Search between "+ start_date+ " - "+end_date);

        
        //Find call list for wach internal number
        config.internal_phone_number.forEach(function callback(internal) {
            var internal_phone = internal.username;
            var password = internal.password;
            str_date_start = moment(start_date).format('YYYY-MM-DD HH:mm:ss');
            str_date_end = moment(end_date).format('YYYY-MM-DD HH:mm:ss');
            var cmd = { "method": "CallLog", "DataStart": str_date_start, "DataEnd": str_date_end };
            console.log(cmd);
            var socket=socket_map.get(internal_phone);
            socket.emit('pbx action', cmd);
        }); //End iteration forEach between internal_phone maps
    },
    //close socket before exit
    close_all_sockets: function () {
        //Force socket closing to be sure that server doesn't switch in protected mode
        socket_map.forEach(function callback(soc, internal_phone, Map) {
            soc.emit("disconnect");
            soc.close();
            socket_map.set(internal_phone,null);
        });
    }
}

function is_internal_number(data) {
    var b = false;
    var internals = config.internal_phone_number;
    for (var j = 0; j < internals.length; j++)
        if (internals[j].username === data) { b = true; }

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
        }
    });

    soc.on('pbx CallLog', function (data) {
        if (data.result == true) {
            var calls = data.rows;
            calls.forEach(function (call) {
                //Outgoing calls                        
                if (is_internal_number(call.caller)) {
                    //Insert only outgoing calls not internal-internal calls                    
                    if (!(is_internal_number(call.called)))
                        database.insert_call(call, "outgoing");
                }
                //Incoming calls
                if (is_internal_number(call.called)) {
                    //Insert only outgoing calls not internal-internal calls
                    if (!(is_internal_number(call.caller)))
                        database.insert_call(call, "incoming");
                }

            });            
        }
    });

    soc.on('pbx Newstate', function (data) {
        if(data.called==="21"){
        console.log("New state");
        console.log(data);}
    });

    soc.on('pbx Hangup', function (data) {
        if(data.called==="21"){
        console.log("Hung up");
        console.log(data);
        }
    });
}