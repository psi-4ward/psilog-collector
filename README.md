# PsiLog::Collector

Stream-based log collecting/aggregation tool written in NodeJS.
Its similar to logstash but uses a lot less memory and has some neat transformers.

## Features
* Highly configurable logpipes
* Easy yaml configuration 
* ElasticSearch mapping presets and config tool
* Config presets for quick logpipe definitons
* Inputs: file(s), tcp
* Metric-Inputs: collect and monitor system load, traffic and other ressources
* Splitters: line
* Parsers: regex, json
* Transformers: regex, addFields, anonymizeIp, parseDate, useragentDetector
* Outputs: elasticsearch, stdout, tcp

... more to come, see the [Wiki](https://github.com/psi-4ward/psilog-collector/wiki)

## Installation

* You need at least NodeJS 0.10.x
* `npm install -g psilog-collector`
* configure your logpipes in `/etc/psilog-collector`
* start the collector: `psilog-collector`

## Configuration
See the [Wiki](https://github.com/psi-4ward/psilog-collector/wiki)

## Licence
PsiLog::collector is licenced under LGPL<br>
PS: Looking forward to your pull-requests ;)
