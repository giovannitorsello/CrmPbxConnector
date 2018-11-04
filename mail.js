var nodemailer = require('nodemailer');

module.exports = {
    sendEmail: function (str_from,str_to, str_subject, str_body, attach_name, attach_data) {
        var message = {
            from: str_from,
            to: str_to,
            subject: str_subject,
            html: start_body,
            attachments: [
                {   // utf-8 string as an attachment
                    filename: 'text1.txt',
                    content: 'hello world!'
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
}

