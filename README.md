# refocus-collector

### Installation

Prerequisite: NPM and Node.js

* Install via Git Clone
    * ```git clone https://github.com/salesforce/refocus-collector.git```
    * ```cd refocus-collector```
    * ```npm install```
    * ```npm link```
    * try command ```refocus-collector```  or ```refocus-collector --help```

  Usage: ```refocus-collector-start [options] [command]```


### Commands

    register <name> <url> <token>  Register collector by name, refocus url and API token
    start <name>                   Start given collector
    stop <name>                    Stop given collector
    status <name>                  Show status of collector
    deregister <name>              Deregister given collector
    help [cmd]                     display help for [cmd]

  Options:

    -h, --help     output usage information
    -V, --version  output the version number

  Examples:

    $ refocus-collector --help
    $ refocus-collector register test test@test.com eygduyguygijfdhkfjhkfdhg
    $ refocus-collector start test
    $ refocus-collector stop test
    $ refocus-collector status test
    $ refocus-collector deregister test
