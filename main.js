
var du = require('date-utils');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var schedule = require('node-schedule');
var session = require('express-session');
var path = require('path');


//local requirements
var config = require('./config.js').config;
var global = require('./global.js');
var pbx = require('./pbx.js');
var db = require('./database.js');
var mail = require('./mail.js');

//safe close all connections before exit
var cleanup = require('./cleanup').cleanup(pbx.close_all_sockets);

//Session data
var session_data = {name: 'crmpbx', secret: 'wifinetcom2019',cookie: {maxAge: 6./0000}};

var app = express();
var router = express.Router();
var upload = multer(); // for parsing multipart/form-data
var path_static= path.join(__dirname, 'views');

//enforcing
app.disable('x-powered-by');

app.use(session(session_data));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/static', express.static(path_static));
app.use("/", router);

app.listen(8088, function () {
    console.log('Server is started.');
    //Start db connection
    db.start_connection();

    var start_date_search = new Date();
    var end_date_search = new Date(start_date_search.getTime() + 5 * 60000);
    pbx.get_pbx_calls_status(start_date_search, end_date_search);

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
    var status=req.body.status;

    if (call_type === "ingresso")   call_type = "incoming";
    if (call_type === "uscita")     call_type = "outgoing";

    if (status === "risposta")      status = "ANSWERED";
    if (status === "non risposta")  status = "NO ANSWER";
    if (status === "occupato")      status = "BUSY";

    db.search_calls(start_date, end_date, call_type,
        internal_phone_number, external_phone_number, customer_contact, status,
        function (result_query) { res.json(result_query); })
});


router.use(function (req, res, next) {
    console.log("/" + req.method);
    next();
});

router.get('/',function (req, res) {
    if(req.sessionID && req.session.account) {        
        res.redirect('/main?token='+req.sessionID);        
    }
    else
        res.sendFile(path_static + "/login.html");
});

router.post('/login', upload.array(), function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    if(req.sessionID && req.session.account) {        
        res.redirect('/main?token='+req.sessionID);        
    }
    
    config.admin_accounts.forEach(function auth(account) {
        if (username === account.username && password === account.password)
        {
            var timestamp = new Date().getTime();
            account.timestamp=timestamp;
            req.session.views++;
            req.session.account=account;            
            sessions.set(req.sessionID,account)
            res.redirect('/main?token='+req.sessionID);
        }
    });
        
    res.redirect('/');
});

router.get("/main", function (req, res) {
    var token=req.query.token;
    if(sessions.has(token)) {
        console.log("Logged in");
        console.log(req.session.account);
        res.sendFile(path_static + "/main.html");
    }
    else
    res.redirect('/');
});

//Schedule read PBX
var job_pbx = schedule.scheduleJob('5 * * * * *', function () {
    //Search every 5 minutes
    var start_date_search = new Date();
    var end_date_search = new Date(start_date_search.getTime() + 5 * 60000);
    pbx.get_pbx_calls_status(start_date_search, end_date_search);
});

//Schedule read PBX
var job_mail = schedule.scheduleJob('* 59 23 * * *', function () {
    mail.sendDailyMail();
});

