# refocus-collector

### Installation

Prerequisite: NPM and Node.js

* Install via Git Clone
    * ```git clone https://github.com/salesforce/refocus-collector.git```
    * ```cd refocus-collector```
    * ```npm install```
    * ```sudo npm link```
    * try command ```rc```  or ```rc --help```

  Usage: ```rc-start [options] [command]```


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

    $ rc --help
    $ rc register test test@test.com eygduyguygijfdhkfjhkfdhg
    $ rc start test
    $ rc stop test
    $ rc status test
    $ rc deregister test