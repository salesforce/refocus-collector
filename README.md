[![Coverage Status](https://coveralls.io/repos/github/salesforce/refocus-collector/badge.svg?branch=master)](https://coveralls.io/github/salesforce/refocus-collector?branch=master)

# refocus-collector

### Installation

Prerequisite: NPM and Node.js

* Install via Git Clone
    * ```git clone https://github.com/salesforce/refocus-collector.git```
    * ```cd refocus-collector```
    * ```npm install```
    * ```npm link```
    * try command ```refocus-collector```  or ```refocus-collector --help```

  Usage: ```refocus-collector [command] [options]```


### Commands

    Start collector for name, refocus url, API token, proxy for refocus and proxy for data source. refocusProxy and dataSourceProxy are optional arguments
    start --collectorName --refocusUrl --accessToken --refocusProxy --dataSourceProxy

    Stop given collector
    stop  --name --refocusProxy

    Show status of collector                  
    status  --name --refocusProxy

    Deregister given collector                 
    deregister  --name --refocusProxy

    Reregister given collector. refocusProxy is an optional argument           
    reregister  --collectorName --refocusUrl --accessToken --refocusProxy

    Display help for [cmd]
    help [cmd]

  Options:

    -n, --name     specify the name of the collector
    -h, --help     output usage information
    -V, --version  output the version number

  Examples:

    $ refocus-collector --help
    $ refocus-collector start --collectorName=PRD_Collector_12345 --refocusUrl=https://refocus.foo.com --accessToken=eygduyguygijfdhkfjhkfdhg --refocusProxy=http://abcproxy.com --dataSourceProxy=http://xyzproxy.com
    $ refocus-collector stop --name=PRD_Collector_12345
    $ refocus-collector status --name=PRD_Collector_12345
    $ refocus-collector deregister --name=PRD_Collector_12345
    $ refocus-collector reregister --collectorName=PRD_Collector_12345 --refocusUrl=https://refocus.foo.com --accessToken=eygduyguygijfdhkfjhkfdhg --refocusProxy=http://abcproxy.com

-----

[Introduction to Sample Generators](docs/pages/collectorintro.md)
