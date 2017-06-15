# refocus-collector

### Installation

Prerequisite: NPM and Node.js

* Install via Git Clone
    * ```git clone https://github.com/salesforce/refocus-collector.git```
    * ```cd refocus-collector```
    * ```npm install```
    * ```npm link```
    * try command ```refocus-collector```  or ```refocus-collector --help```

  Usage: ```refocus-collector-start [command] [options```


### Commands

    register --url --token --name Register collector by name, refocus url and API token
    start --name                  Start given collector
    stop  --name                  Stop given collector
    status  --name                Show status of collector
    deregister  --name            Deregister given collector
    help [cmd]                    Display help for [cmd]

  Options:

    -n, --name     specify the name of the collector
    -h, --help     output usage information
    -V, --version  output the version number

  Examples:

    $ refocus-collector --help
    $ refocus-collector register --url=https://refocus.foo.com --token=eygduyguygijfdhkfjhkfdhg --name=PRD_Collector_12345
    $ refocus-collector start --name=PRD_Collector_12345
    $ refocus-collector stop --name=PRD_Collector_12345
    $ refocus-collector status --name=PRD_Collector_12345
    $ refocus-collector deregister --name=PRD_Collector_12345
