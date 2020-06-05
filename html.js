var date_start;
var date_end;

function getHtmlFromMap(map) {
    var tableHeader = "<table border='1'><theader><td>n.</td><td>Chiamante</td><td>Interno</td><td>Orario</td><td>Durata</td><td>Flusso</td><theader>";
    var tableFoot = "</table>";
    var strHtml="";
    map.forEach(function callback(call, i, Map) {
        var begin = new Date(call.begin);
        var hour_begin = begin.getHours() + ":" + begin.getMinutes();
        strHtml += "<tr>" + "<td>" + i + "</td><td>" +
            call.caller + "</td><td>" +
            call.called + "</td><td>" +
            hour_begin + "</td><td>" +
            call.duration + "</td><td>" +
            JSON.stringify(call.callflow) + "</td></tr>";
    });
    return tableHeader+strHtml+tableFoot;
}

module.exports = {
    
    getResultPage: function (res, date_start, date_end) {
        var str_inc_noans = getHtmlFromMap(incoming_noanswered_calls);    
        var str_out_noans = getHtmlFromMap(outgoing_noanswered_calls);
        var str_inc_ans = getHtmlFromMap(incoming_answered_calls);
        var str_out_ans = getHtmlFromMap(outgoing_answered_calls);
        today = Date.today();
        tomorrow = Date.tomorrow();
        str_date_start = date_start.toFormat("YYYY-MM-DD 00:00:00");
        str_date_end = date_end.toFormat("YYYY-MM-DD 00:00:00");

        res.setHeader("Content-Type", "text/html");
        res.write("<html>");
        res.write("<body>");
        res.write("<script>setTimeout(function(){window.location.reload(1);}, 15000);</script>");
    
        if (today) res.write("<p><b>Data inizio report: " + today.toFormat("DD-MM-YYYY") + "</b></p>");
        if (tomorrow) res.write("<p><b>Data fine report: " + tomorrow.toFormat("DD-MM-YYYY") + "</b></p>");
    
        res.write("<p><b>Chiamate in ingresso non risposte</b></p>");
        res.write(str_inc_noans);
    
        res.write("<p><b>Chiamate in uscita non risposte</b></p>");
        res.write(str_out_noans);
    
    
        res.write("<p>Chiamate in ingresso risposte</p>");
        res.write(str_inc_ans);
    
        res.write("<p>Chiamate in uscita risposte</p>");
        res.write(str_out_ans);
        res.write("</body>");
        res.write("</html>");
        res.end();
    }
    

}