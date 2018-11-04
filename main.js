
var du = require('date-utils');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); 

//local requirements
var config = require('./config.js').config;
var global = require('./global.js');
var pbx = require('./pbx.js');
var html = require('./html.js');
var db = require('./database.js');
var mail = require('./mail.js');

//safe close all connections before exit
var cleanup = require('./cleanup').cleanup(pbx.close_all_sockets);

start_date = Date.today();
end_date = Date.tomorrow();

var app = express();
var router = express.Router();
var upload = multer(); // for parsing multipart/form-data
var path = __dirname + '/views/';

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/static',express.static(path));
app.use("/", router);

app.listen(8088, function () {
    console.log('Server is started.');
    //Start db connection
    //db.start_connection();

    /*
        pbx.get_pbx_calls_status();
        //Update every minute
        setInterval(pbx.get_pbx_calls_status, 60000);    
        */
});


app.get('/config/internal_phone_number_list', function (request, response) {
    response.json(config.internal_phone_number);    
});

app.get('/config/external_phone_number_list', function (request, response) {
    response.json(config.external_phone_number);
});




router.use(function (req, res, next) {
    console.log("/" + req.method);
    next();
});

router.get("/", function (req, res) {
    res.sendFile(path + "login.html");
});


router.post('/login', upload.array(), function (req, res, next) {
    var username=req.body.username;
    var password=req.body.password;
    //if(username=="giovanni" && password=="torsello")
        res.redirect('/main');  
    //else
    //    res.redirect('/');
  });

router.get("/main", function (req, res) {
    res.sendFile(path + "main.html");
});

router.get("/about", function (req, res) {
    res.sendFile(path + "about.html");
});

/*
app.use("*", function (req, res) {
    res.sendFile(path + "404.html");
});
*/



