# PsiLog::Collector

Stream-based log collecting tool written in NodeJS.
Its similar to logstash but uses a lot less memory and has some neat transformers.

## Installation

* You need at least NodeJS 0.10.x
* Download it: archive/master.zip
* unzip it
* run `npm install`
* configure your logpipes
* start the collector: `node app.js`

## Configuration
The config files uses the YAML language, see http://en.wikipedia.org/wiki/YAML

Tip: the config gets loaded recursively so you can create subfolders

### main.yaml
The main configuration file holding some global settings

### presets folder
The presets folder contains some config templates which can be referenced in the logpipes

### logpipes folder
Each file contains a logpipe configuration

For examples the the `conf.d` folder.


## Logpipes

A `Logpipe` is a stream to process the log data.

### input
The **Input** is the starting point to collect/fetch/receive the data.

#### file
Tails a growing file. If the file gets deleted and another one is 
recreated with the same name it continues reading the new file.

* @param {string} `file` The file to tail

#### files
Tail all matching files within a directory

* start tailing when new files are added
* stop tailing when files are deleted
* rename a file acts like delete+add

* @param {string} `dir` Directory to watch
* @param {string} `glob` A globbing pattern to filter the files (ie *.log)

#### tcp
Spawns a TCP-Server receiving the data

 * @param {string} ip         the bind ip, defaults to 0.0.0.0
 * @param {string} port       the bind port, default 6543
 * @param {string} [password] an optional password, it has to be the first data for each new connection followd by a \n
 

### splitter
A Splitter transforms the input stream into single objects.

#### line
Split by \r?\n

### parsers
A parsers transforms the objects to JSON.

#### regex
Converts a string object to JSON using a regex

 * @param {string} `regex`
 * @params {array} `fields` An array with fieldnames for each regex matching group

#### parseJson
Converts a string object to JSON using JSON.parse()

### transformers
Transformers alter the JSON data

#### addFields
Adds properties to the JSON

* @param {object} `fields` e.g. {myField: 'myValue'}

#### parseDate
Convert a Date string into an unix timestamp <br>
Uses momentjs http://momentjs.com/docs/#/parsing/string-format/

 * @param {string} `field` The name of the field holding the date string
 * @param {string} `format` The momentjs date format
 * @param {string} `target` If set, the timestamp gets saved to this field instead of overwriting `field`
 
#### anonymizeIp
scramble the last octet of an ip-address (supports v4 and v6 addresses)

* @param {string} `ipField` the name of the field holding the IP

#### useragentDetector
Parse the useragent from an http-requests agent string and store
the result object in `useragent_paresed` field
 
 * @param {string} `useragentField` the name of the field holding the useragent string

### parsers
A parsers transforms the JSON into an output supported object 

#### stringifyJson

### outputs

#### stdout
Prints the data to stdout

#### elasticsearch
Store the JSON into elasticsearch

* @param {string} `host` The elasticsearch host
* @param {int}    `port` The elastichsearch port

#### tcp
Stream the data to an TCP-Socket

 * @param {string} ip
 * @param {string} port
 * @param {string} [password] an optional password, its the first data sent

You can use this output to stream the data to PsiLog::Collector running on another host
 

## Licence
PsiLog::collector is licenced under LGPL<br>

PS: Looking forward to your pull-requests ;)