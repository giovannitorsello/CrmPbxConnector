var nodemailer = require('nodemailer');
var moment = require('moment');
var fs = require('fs');
var xlsx = require('xlsx');
var xlsx_node = require('node-xlsx');

var config = require('./config.js').config;
var global = require('./global.js');
var db = require('./database.js');

module.exports = {
    sendDailyMail: function (statistics) {
        var date = new Date();
        var start_date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var end_date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        //Format in italian conversion inside for DB function for query
        start_date = moment(start_date).format('DD/MM/YYYY HH:mm:ss');
        end_date = moment(end_date).format('DD/MM/YYYY HH:mm:ss');

        var date_report=moment(new Date()).format('DD/MM/YYYY HH:mm:ss');
        var str_body = "<h1><strong>CrmPBX:  report chiamate in ingresso non risposte al "+date_report+"</strong></h1><br><br>";

        var call_to_internal_report = "<b>Chiamate perse per numerazione contattata</b> <br>";
        statistics.external_phones.forEach(function (external, index_external) {
            var phone = statistics.external_phones[index_external].phone;
            var noans = statistics.external_phones[index_external].noanswer_calls;

            call_to_internal_report += phone + "\t\t" + noans + "<br>";
        });
        str_body += call_to_internal_report;
        str_body +="<br><br><br>";

        var call_noans_report = "<b>Elenco chiamate perse</b> <br>";
        //find non answer call in db
        db.double_filter_noanswer(start_date, end_date, "incoming", "", "", "", "", function (calls) {
            calls.forEach(element => {
                element.begin=moment(element.begin).format('DD/MM/YYYY HH:mm:ss');
                call_noans_report += element.begin + "\t\t" + element.caller + "\t\t" + element.dst + "<br>"
            });

            str_body += call_noans_report;
            sendEmail(
                "wifinetcom.backup@gmail.com",
                config.email_report,
                "CrmPBX ---- Chiamate non risposte al " + date_report,
                str_body, "");
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
    if(attach_name==="") message.attachments=null;


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
