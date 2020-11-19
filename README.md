ssh-manager
===

A powerful ssh connections manager.

### Install
npm install ssh-manager -g

### Configuration
Start the script with `ssh-manager` and you will see it running with few sample servers, to add yours,
you have to create a configuration file with **json** or **csv** extension with the format bellow:

JSON file:
```
[
  {
    "name": "Test Server1",
    "user": "alejandro",
    "host": "8.8.8.8"
  },
  {
    "name": "Test Server2",
    "user": "paul",
    "host": "7.8.8.8",
    "port": 23,
    "pem": "test.pem"
  }
]
```

CSV file:
```
name,user,host,port,pem
Test Server1,alejandro,8.8.8.8
Test Server2,paul,7.8.8.8,23,test.pem
```
> *port* and *pem* are optional fields.

Once you have your file ready you can provide it with the option `-f` or `--file`.

### Usage
```
Usage: ssh-manager [options]

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Provide a json or csv file with servers                [string]
  -o, --order    Order the table by the given column
                [string] [choices: "name", "id", "user", "host", "port", "auth"]
  -s, --server   Specify the server name or id to connect               [string]
  -n, --nocheck  Disable the server connection checks                  [boolean]
  -t, --timeout  Timeout for server checks in milliseconds        [default: 500]
  -h, --help     Show help                                             [boolean]

https://github.com/alemures
```
