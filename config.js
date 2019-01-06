module.exports = {
    config: {
        internal_phone_number: [
            { id: "64420", username: "20", password: "6u6aqa5y"}, //Acquepure
            { id: "64421", username: "21", password: "ju4ahu4y"}, //Acquepure
            /*{ id: "64422", username: "22", password: "ana6yzum"},*/
            { id: "64423", username: "23", password: "uqyzuneh"}, //Idroservice
            { id: "64424", username: "24", password: "gu6a7usu"}, //Idroservice
            { id: "64425", username: "25", password: "jynu9uha"}  //Idroservice
        ],
        external_phone_number: [
            
            "07751778002",  //Acquepure Italia SRL Lazio
            "08251884292",  //Acquepure Italia SRL Campania
            "0598630200",   //Acquepure Italia SRL Emilika Romagna
            "04311938066",  //Acquepure Italia SRL Friuli Venezia Giulia            
            "0283595056",   //Acquepure Italia SRL Lombardia
            "0110240418",   //Acquepure Italia SRL Piemonte
            "08331692236",  //Acquepure Italia SRL Puglia
            "0912747795",   //Acquepure Italia SRL Sicilia Palermo
            "0942388006",   //Acquepure Italia SRL Sicilia Messina
            "0950973722",   //Acquepure Italia SRL Sicilia Catania
            "0982640787",   //Acquepure Italia SRL Calabria
            "0508068095",   //Acquepure Italia SRL Toscana
            "0833721510",   //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            "0833730083",   //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            "0833727224",   //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            "08331856326",  //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            "0833722459",   //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            "0833727954",   //IdroServiceItalia SRL Divisione Centro Sud - Acquarica
            "0902927880",   //IdroServiceItalia SRL Divisione Sicilia Messina
            "0908966300",   //IdroServiceItalia SRL Divisione Sicilia Messina
            "0942388009",   //IdroServiceItalia SRL Divisione Sicilia Messina
            "0942795855",   //IdroServiceItalia SRL Divisione Sicilia Messina
            "0942798163",   //IdroServiceItalia SRL Divisione Sicilia Messina
            "0942896212",   //Sicilia
            "0707058021"  //
        ],
        admin_accounts: [{username: "torsello", password: "ponzo2018", role: "administrator"}, 
                         {username: "pomarico", password: "ponzo2018", role: "administrator"},
                         {username: "ponzo", password: "ponzo2018", role: "user"}],
        database_config: "./install/schema_db.sql",
        minutes_treshold_outgoing_call_in_month: 500
    }
}

/*{"method":"CallLog", "DataStart":"2018-11-19 00:00:00", "DataEnd":"2018-11-21 00:00:00"}*/