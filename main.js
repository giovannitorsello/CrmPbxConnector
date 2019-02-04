
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var schedule = require('node-schedule');
var session = require('express-session');
var moment = require('moment');
var path = require('path');
// Needed fo xls import
var express_formidable = require('express-formidable');
var formidable = require('formidable');
var fs = require('fs');
var xlsx = require('xlsx');
var xlsx_node = require('node-xlsx');
var xlsx_json = require('xlsx-parse-json');
//need for external programs
const crypto = require('crypto');

//local requirements
var config = require('./config.js').config;
var global = require('./global.js');
var pbx = require('./pbx.js');
var db = require('./database.js');
var mail = require('./mail.js');

//Real time statistics data
var statistics = {};

//safe close all connections before exit
var cleanup = require('./cleanup').cleanup(pbx.close_all_sockets);

//Session data
var session_data = { name: 'crmpbx', secret: 'wifinetcom2019', cookie: { maxAge: 6. / 0000 } };

var app = express();
var router = express.Router();
var upload = multer(); // for parsing multipart/form-data
var path_static = path.join(__dirname, 'views');

//enforcing
app.disable('x-powered-by');

app.use(session(session_data));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/static', express.static(path_static));
app.use("/", router);

//For upload
app.use(express_formidable({
    encoding: 'utf-8',
    uploadDir: path.join("/tmp"),
    multiples: true,
    keepExtensions: true // req.files to be arrays of files
}));

app.listen(8088, function () {
    console.log('Server is started.');

    //Start db connection
    db.start_connection();
    make_statistics();

    var initial_past_day = 1;
    for (var i = initial_past_day; i > initial_past_day - 1; i--) {
        var start_date_search = new Date(new Date().getTime() - i * (86400000));
        var end_date_search = new Date(new Date().getTime() - (i - 1) * (86400000));
        pbx.get_pbx_calls_status(start_date_search, end_date_search);
    }


    /* var start_date_search = new Date();start_date_search.setHours(0,0,0,0); 
     var end_date_search = new Date();  end_date_search.setHours(23,59,59,0); 
     pbx.get_pbx_calls_status(start_date_search, end_date_search);
 */
});

function encrypt(obj, password) {
    if (password.length !== 32) return "";
    var AES_METHOD = 'aes-256-cbc';
    let iv = "1111111111111111";
    let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(password), new Buffer(iv));
    let encrypted = cipher.update(JSON.stringify(obj));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

app.use("/get_today_noanswer_calls", function (req, res, next) {
    var password = req.query.password;
    if (!password || password === "") { next(); return; }

    var start_date = moment().startOf('day');
    var end_date = moment().endOf('day');
    var call_type = "incoming";
    var status = "NO ANSWER";
    db.double_filter_noanswer(start_date, end_date, call_type, "", "", "", status,
        function (result_query) {
            var export_data = [];
            result_query.forEach(function (call, index) {
                delete call.calldata; delete call.callflow; delete call.other_calls;delete call.hash_call_id; delete call.id;
                export_data.push(call);

                if (index === result_query.length-1) {
                    var crypted = encrypt(export_data, password);
                    res.setHeader('Content-type', "application/octet-stream");
                    res.setHeader('Content-disposition', 'attachment; filename=file.txt');
                    res.send(crypted);                    
                    next();
                }
            })
        });
});

app.use("/get_today_answered_calls", function (req, res, next) {
    var password = req.query.password;
    if (!password || password === "") { next(); return; }

    var start_date = moment().startOf('day');
    var end_date = moment().endOf('day');
    var call_type = "incoming";
    var status = "ANSWERED";
    db.search_calls_normal(start_date, end_date, call_type, "", "", "", status,
    function (result_query) {
        var export_data = [];
        result_query.forEach(function (call, index) {
            delete call.calldata; delete call.callflow; delete call.other_calls;delete call.hash_call_id; delete call.id;
            export_data.push(call);

            if (index === result_query.length-1) {
                var crypted = encrypt(export_data, password);
                res.setHeader('Content-type', "application/octet-stream");
                res.setHeader('Content-disposition', 'attachment; filename=file.txt');
                res.send(crypted);                    
                next();
            }
        })
    });
});

app.get('/config/internal_phone_number_list', function (request, response) {
    response.json(config.internal_phone_number);
});

app.get('/config/external_phone_number_list', function (request, response) {
    response.json(config.external_phone_number);
});

router.post('/search_calls', upload.array(), function (req, res, next) {
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var call_type = req.body.call_type;
    var internal_phone_number = req.body.internal_phone_number;
    var external_phone_number = req.body.external_phone_number;
    var customer_contact = req.body.customer_contact;
    var status = req.body.status;
    var calls_search = db.search_calls_normal;

    if (call_type === "ingresso") call_type = "incoming";
    if (call_type === "uscita") call_type = "outgoing";

    if (status === "") { status = ""; calls_search = db.search_calls_normal; }
    if (status === "risposte") { status = "ANSWERED"; calls_search = db.search_calls_normal; }
    if (status === "non_risposta") { status = "NO ANSWER"; calls_search = db.search_calls_normal; }
    if (status === "occupato") { status = "BUSY"; calls_search = db.search_calls_normal; }

    if (status === "da_richiamare") { status = "NO ANSWER"; calls_search = db.double_filter_noanswer; }

    calls_search(start_date, end_date, call_type,
        internal_phone_number, external_phone_number, customer_contact, status,
        function (result_query) {
            res.json(result_query);
        });
});


router.use(function (req, res, next) {
    console.log("/" + req.method);
    next();
});

router.get('/', function (req, res) {
    if (req.sessionID && req.session.account) {
        res.redirect('/main?token=' + req.sessionID);
    }
    else
        res.sendFile(path_static + "/login.html");
});

router.post('/login', upload.array(), function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    if (req.sessionID && req.session.account) {
        res.redirect('/main?token=' + req.sessionID);
    }

    config.admin_accounts.forEach(function auth(account) {
        if (username === account.username && password === account.password) {
            var timestamp = new Date().getTime();
            account.timestamp = timestamp;
            req.session.views++;
            req.session.account = account;
            sessions.set(req.sessionID, account)
            res.redirect('/main?token=' + req.sessionID);
        }
    });

    res.redirect('/');
});

router.get("/main", function (req, res) {
    var token = req.query.token;
    if (sessions.has(token)) {
        console.log("Logged in");
        console.log(req.session.account);
        res.sendFile(path_static + "/main.html");
    }
    else
        res.redirect('/');
});

router.post('/import/calls', function (req, res, next) {
    var form = new formidable.IncomingForm();
    var file_uploaded;
    form.parse(req);
    form.on('fileBegin', function (name, file) {
        file.path = '/tmp/' + file.name;
        file_uploaded = file.path;
    });

    form.on('file', function (name, file) {
        console.log('Uploaded ' + file.name);
        var workbook = xlsx.readFile(file_uploaded);
        var sheet_name_list = workbook.SheetNames;
        var obj = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        if (obj && obj.length > 0)
            obj.forEach(function (element, index) {
                console.log(element);
                db.insert_call_from_xlsx(element);

                if (index === obj.length - 1)
                    res.send({ status: 'ok', lenght: obj.length });
            });
    });
});

router.post("/get_account", function (req, res) {
    res.send(req.session.account);
});

router.post("/get_statistics", function (req, res) {
    res.send(statistics);
});


//Schedule operation
var job_pbx = schedule.scheduleJob('*/5 * * * *', function () {
    make_statistics();
    download_calls_data_from_pbx();
});

function make_statistics() {
    statistics_external_phone_daily();
    statistics_internal_phone_daily();
    minutes_consuming_outgoing_calls();
}

function statistics_external_phone_daily() {
    //Init statistic array for internal phones
    statistics.external_phones = [];
    //prepare internal phones statistics structure
    config.external_phone_number.forEach(function (external, index_external) {
        statistics.external_phones[index_external] = {};
        statistics.external_phones[index_external].phone = external.phone;
        statistics.external_phones[index_external].description = external.description;
        statistics.external_phones[index_external].answered_calls = 0;
        statistics.external_phones[index_external].noanswer_calls = 0;
    });
    var date = new Date();
    var start_date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var end_date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    //Format in italian conversion inside for DB function for query
    start_date = moment(start_date).format('DD/MM/YYYY HH:mm:ss');
    end_date = moment(end_date).format('DD/MM/YYYY HH:mm:ss');

    //Incoming call NO ANSWER in real time
    db.double_filter_noanswer(start_date, end_date, "incoming", "", "", "", "", function (calls) {
        calls.forEach(function (call, index) {
            statistics.external_phones.forEach(function (external, index_external) {
                if (external.phone === call.dst) {
                    if (call.status === "NO ANSWER" || call.status === "BUSY")
                        statistics.external_phones[index_external].noanswer_calls++;
                    //db.insert_statistic("statistics",JSON.stringify(statistics));
                }
            });
        });
    });

    //Incoming call ANSWER in real time
    db.get_call(start_date, end_date, "incoming", "ANSWERED", function (res) {
        if (res.status && res.status === "OK") {
            var query_result = res.query_results;
            query_result.forEach(function (call, index_call) {
                statistics.external_phones.forEach(function (external, index_external) {
                    if (external.phone === call.dst) {
                        if (call.status === "ANSWERED") {
                            statistics.external_phones[index_external].answered_calls++;
                            //db.insert_statistic("statistics",JSON.stringify(statistics));                     
                        }
                    }
                });
                if (index_call === query_result.length - 1) { }
            });
        }
    });
}

function statistics_internal_phone_daily() {
    //Init statistic array for internal phones
    statistics.internal_phones = [];
    //prepare internal phones statistics structure
    config.internal_phone_number.forEach(function (internal, index_internal) {
        statistics.internal_phones[index_internal] = {};
        statistics.internal_phones[index_internal].phone = internal.username;
        statistics.internal_phones[index_internal].work_daily_time_incoming_calls = 0;
        statistics.internal_phones[index_internal].work_incoming_calls = 0;

        statistics.internal_phones[index_internal].work_outgoing_calls = 0;
        statistics.internal_phones[index_internal].work_daily_time_outgoing_calls = 0;
    });

    var date = new Date();
    var start_date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var end_date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    //Format in italian conversion inside for DB function for query
    start_date = moment(start_date).format('DD/MM/YYYY HH:mm:ss');
    end_date = moment(end_date).format('DD/MM/YYYY HH:mm:ss');

    //Compute outgoing call time data in the last moth
    db.get_call(start_date, end_date, "incoming", "ANSWERED", function (res) {
        if (res.status && res.status === "OK") {
            var query_result = res.query_results;
            query_result.forEach(function (call, index_call) {
                statistics.internal_phones.forEach(function (internal, index_internal) {
                    if (internal.phone === call.called) {
                        statistics.internal_phones[index_internal].work_daily_time_incoming_calls += call.billsec;
                        statistics.internal_phones[index_internal].work_incoming_calls++;
                    }
                });
                if (index_call === query_result.length - 1) { }
            });
        }
    });

    //Compute outgoing call time data in the last moth
    db.get_call(start_date, end_date, "outgoing", "ANSWERED", function (res) {
        if (res.status && res.status === "OK") {
            var query_result = res.query_results;
            query_result.forEach(function (call, index_call) {
                statistics.internal_phones.forEach(function (internal, index_internal) {
                    if ((internal.phone === call.caller) && (!is_internal_number(call.called))) {
                        statistics.internal_phones[index_internal].work_daily_time_outgoing_calls += call.billsec;
                        statistics.internal_phones[index_internal].work_outgoing_calls++;
                    }
                });
                if (index_call === query_result.length - 1) { }
            });
        }
    });
}

function minutes_consuming_outgoing_calls() {

    var date = new Date();
    var start_date = new Date(date.getFullYear(), date.getMonth(), 1);
    var end_date = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    //Format in italian conversion inside for DB function for query
    start_date = moment(start_date).format('DD/MM/YYYY HH:mm:ss');
    end_date = moment(end_date).format('DD/MM/YYYY HH:mm:ss');

    //Compute outgoing call time data in the last moth
    db.get_call(start_date, end_date, "outgoing", "ANSWERED", function (res) {
        if (res.status && res.status === "OK") {
            var query_result = res.query_results;
            var minutes_outgoing_calls_in_month = 0;
            query_result.forEach(function (call, index) {
                minutes_outgoing_calls_in_month += call.billsec;

                //exit condition
                if (index === query_result.length - 1) {
                    //conversion in minutes two digits approximation
                    minutes_outgoing_calls_in_month = Number(minutes_outgoing_calls_in_month / 60).toFixed(2);
                    //Over treshold calculation
                    var minutes_overtreshold_outgoing_call_in_month = minutes_outgoing_calls_in_month - config.minutes_treshold_outgoing_call_in_month;
                    if (minutes_overtreshold_outgoing_call_in_month < 0) minutes_overtreshold_outgoing_call_in_month = 0;

                    db.insert_statistic("minutes_outgoing_calls_in_month", minutes_outgoing_calls_in_month);
                    db.insert_statistic("minutes_overtreshold_outgoing_call_in_month", minutes_overtreshold_outgoing_call_in_month);
                    db.insert_statistic("outgoing_calls_in_month", query_result.length);

                    statistics.minutes_treshold_outgoing_call_in_month = config.minutes_treshold_outgoing_call_in_month;
                    statistics.minutes_outgoing_calls_in_month = minutes_outgoing_calls_in_month;
                    statistics.outgoing_calls_in_month = query_result.length;
                    statistics.minutes_overtreshold_outgoing_call_in_month = minutes_overtreshold_outgoing_call_in_month;

                }
            });
        }
    });
}



//Schedule download data
function download_calls_data_from_pbx() {
    var durationSearchInMinutes = 20;
    var start_date_search = new Date();
    var end_date_search = new Date();
    start_date_search.setMinutes(start_date_search.getMinutes() - durationSearchInMinutes);
    end_date_search.setMinutes(end_date_search.getMinutes() + 5);
    pbx.get_pbx_calls_status(start_date_search, end_date_search);
}


//Schedule send email
//var job_mail = schedule.scheduleJob('*/3 * * * *', function () {
/*
var job_mail = schedule.scheduleJob('37 21 * * *', function () {
    //Order statistics event
    var extr_phone=statistics.external_phones;
    extr_phone.sort((a, b) => (a.noanswer_calls > b.noanswer_calls) ? -1 : ((b.noanswer_calls > a.noanswer_calls) ? 1 : 0));            
    statistics.external_phones=extr_phone;    
    mail.sendDailyMail(statistics);
});
*/


function is_internal_number(data) {
    var b = false;
    var internals = config.internal_phone_number;
    for (var j = 0; j < internals.length; j++)
        if (internals[j].username === data) { b = true; }

    return b;
}