module.exports = {
    config: {
        internal_phone_number: [
            { id: "64420", username: "20", password: "6u6aqa5y"}, //Acquepure
            { id: "64421", username: "21", password: "ju4ahu4y"}, //Acquepure
            { id: "64422", username: "22", password: "ana6yzum"},
            { id: "64423", username: "23", password: "uqyzuneh"}, //Idroservice
            { id: "64424", username: "24", password: "gu6a7usu"}, //Idroservice
            { id: "64425", username: "25", password: "jynu9uha"}  //Idroservice
        ],
        external_phone_number: [
            {phone: "07751778002", description: 'Acque Lazio'},                     //Acquepure Italia SRL Lazio
            {phone: "08251884292", description: 'Acque Campania'},                  //Acquepure Italia SRL Campania
            {phone: "0598630200",  description: 'Acque Em. Romagna'},               //Acquepure Italia SRL Emilia Romagna
            {phone: "04311938066", description: 'Acque F. Ven. Giulia'},            //Acquepure Italia SRL Friuli Venezia Giulia            
            {phone: "0283595056",  description: 'Acque Lombardia'},                 //Acquepure Italia SRL Lombardia
            {phone: "0110240418",  description: 'Acque Piemonte'},                  //Acquepure Italia SRL Piemonte
            {phone: "08331692236", description: 'Acque Puglia'},                    //Acquepure Italia SRL Puglia
            {phone: "0912747795",  description: 'Acque Palermo'},                   //Acquepure Italia SRL Sicilia Palermo
            {phone: "0942388006",  description: 'Acque Messina'},                   //Acquepure Italia SRL Sicilia Messina
            {phone: "0950973722",  description: 'Acque Sicilia-Catania'},           //Acquepure Italia SRL Sicilia Catania
            {phone: "0982640787",  description: 'Acque Calabria'},                  //Acquepure Italia SRL Calabria
            {phone: "0508068095",  description: 'Acque Toscana'},                   //Acquepure Italia SRL Toscana
            {phone: "0833721510",  description: 'Idros Centro Sud-Presicce'},       //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            {phone: "0833730083",  description: 'Idros Centro Sud-Presicce'},       //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            {phone: "0833727224",  description: 'Idros Centro Sud-Presicce'},       //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            {phone: "08331856326", description: 'Idros Centro Sud-Presicce'},       //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            {phone: "0833722459",  description: 'Idros Centro Sud-Presicce'},       //IdroServiceItalia SRL Divisione Centro Sud - Presicce           
            {phone: "0833727954",  description: 'Idros Centro Sud-Acquarica'},      //IdroServiceItalia SRL Divisione Centro Sud - Acquarica
            {phone: "0902927880",  description: 'Idros Centro Sicilia-Messina'},    //IdroServiceItalia SRL Divisione Sicilia Messina
            {phone: "0908966300",  description: 'Idros Centro Sicilia-Messina'},    //IdroServiceItalia SRL Divisione Sicilia Messina
            {phone: "0942388009",  description: 'Idros Centro Sicilia-Messina'},    //IdroServiceItalia SRL Divisione Sicilia Messina
            {phone: "0942795855",  description: 'Idros Centro Sicilia-Messina'},    //IdroServiceItalia SRL Divisione Sicilia Messina
            {phone: "0942798163",  description: 'Idros Centro Sicilia-Messina'},    //IdroServiceItalia SRL Divisione Sicilia Messina
            {phone: "0942896212",  description: 'Idros Centro Sicilia-Messina'},    //Sicilia
            {phone: "0707058021",  description: 'Non Associato'}                    //Non associato
        ],
        admin_accounts: [{username: "torsello", password: "ponzo2018", role: "administrator"}, 
                         {username: "pomarico", password: "ponzo2018", role: "administrator"},
                         {username: "ponzo", password: "ponzo2018", role: "user"}],
        database_config: "./install/schema_db.sql",
        minutes_treshold_outgoing_call_in_month: 500
    }
}

/*{"method":"CallLog", "DataStart":"2018-11-19 00:00:00", "DataEnd":"2018-11-21 00:00:00"}*/