var nodemailer = require('nodemailer');
var db = require('./database.js');

module.exports = {
    sendDailyMail: function () {
        var now = new Date();
        var start_date_str = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDay() + " 00:00:00"
        var end_date_str = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDay() + " 23:59:59"
        var startdate = new Date(start_date_str);
        var enddate = new Date(end_date_str);
        var str_body="In allegato le chiamate in ingresso non risposte del "+startdate;
        //find non answer call in db
        db.search_calls(startdate, enddate, "incoming", "", "", "", "NO ANSWERED", function (results_query) {
            var call_file="";
            results_query.forEach(element => {
                call_file=element.begin+"\t\t"+element.caller+"--->"+element.called+"\r\n"
            });

            sendEmail(
                "wifinetcom.backup@gmail.com",
                "giovanni.torsello@gmail.com",
                "Chiamate non risposte del " + start_date_str,
                str_body, "ChiamateIngressoNonRisposte.txt", call_file);
        });
    }
}


function sendEmail(str_from, str_to, str_subject, start_body, attach_name, attach_data) {
    var message = {
        from: str_from,
        to: str_to,
        subject: str_subject,
        html: start_body,
        attachments: [
            {   // utf-8 string as an attachment
                filename: attach_name,
                content: attach_data
            }]
        };



    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'wifinetcom.backup@gmail.com',
            pass: 'WifinetcomBackup2018'
        }
    });

    transporter.sendMail(message, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
