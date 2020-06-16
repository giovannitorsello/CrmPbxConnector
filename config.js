var fs = require('fs');
var path = require('path');

module.exports = {
    readConfigFromFile: function(file){
        var local_path=process.cwd();
        console.log("Config path is: "+local_path);
        var config_filename=local_path+'/config.json';
        if (!fs.existsSync(config_filename)){            
            console.log("Configuration file not found in "+local_path);
            process.exit(-1);
        }
        this.config = JSON.parse(fs.readFileSync(local_path+'/config.json', 'utf8'));
        console.log("Read configuration file is: "+config_filename);
        console.log(this.config);
        if(this.config===null) return null;
        return this.config;
    },
    config: {
    }
}

/*{"method":"CallLog", "DataStart":"2018-11-19 00:00:00", "DataEnd":"2018-11-21 00:00:00"}*/