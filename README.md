# refocus-collector

  Usage: rc-start [options] [command]


  Commands:

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
  ____       __                         ____      _ _           _
 |  _ \ ___ / _| ___   ___ _   _ ___   / ___|___ | | | ___  ___| |_ ___  _ __
 | |_) / _ \ |_ / _ \ / __| | | / __| | |   / _ \| | |/ _ \/ __| __/ _ \| '__|
 |  _ <  __/  _| (_) | (__| |_| \__ \ | |__| (_) | | |  __/ (__| || (_) | |
 |_| \_\___|_|  \___/ \___|\__,_|___/  \____\___/|_|_|\___|\___|\__\___/|_|
