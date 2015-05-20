/* Parser: lumberjack */

var api = require('../api.js');
var util = require('util');
var Transform = require('stream').Transform;
var zlib = require('zlib');


function Lumberjack(config) {
  if(!(this instanceof Lumberjack)) {
    return new Lumberjack();
  }
  this.config = config;
  Transform.call(this, {objectMode: true});

  this.tmpBuffer = null;
  this.dataFrameCounter = 0;
  this.windowSize = 0;

}
util.inherits(Lumberjack, Transform);


Lumberjack.prototype._transform = function(buf, enc, cb) {
  if(!buf.length) return cb();

  if(this.tmpBuffer) {
    buf = Buffer.concat([this.tmpBuffer, buf]);
    this.tmpBuffer = null;
  }

  this._parser(buf, cb);
};

/**
 * Parse an frame
 * @param buf
 * @param cb
 * @returns {*}
 * @private
 */
Lumberjack.prototype._parser = function(buf, cb) {
  // byte 0 is version
  var orgBuf = buf;
  var frameType = buf.toString('ascii', 1, 2);
  buf = buf.slice(2);

  switch(frameType) {

    // Window size frame
    case 'W':
      /* Payload:
       32bit unsigned window size value in units of whole data frames.
       */
      if(buf.length < 4) {
        this.tmpBuffer = orgBuf;
        return cb();
      }

      this.windowSize = buf.readUInt32BE();
      api.logger.debug('[' + this.config.name + '] Sliding window size:', this.windowSize);

      if(buf.length > 4) {
        return this._parser(buf.slice(4), cb);
      }
      cb();
      break;

    // Data frame
    case 'D':
      // no length checking necessarry, buffer contains complete frame becaues its was uncompressed
      return this._parseData(buf, cb);
      break;

    // Compression start frame
    case 'C':
      if(buf.length < 4) {
        this.tmpBuffer = orgBuf;
        return cb();
      }

      var length = buf.readUInt32BE();

      if(buf.length < 4+length) {
        this.tmpBuffer = orgBuf;
        return cb();
      }

      api.logger.debug('[' + this.config.name + '] Compressed frame:', length, 'Bytes');

      // uncompress and parse payload
      this._parser(zlib.unzipSync(buf.slice(4, length)), cb);

      if(buf.length > 4 + length) {
        return this._parser(buf.slice(4 + length), cb);
      }
      return;
      break;

    default:
      api.logger.error('[' + this.config.name + ']', 'Invalid frameType:', frameType);
      cb();
      break;
  }
};


Lumberjack.prototype._parseData = function _parseData(buf, cb) {
  /* Payload:
   32bit unsigned sequence number
   32bit 'pair' count (how many key/value sequences follow)
   32bit unsigned key length followed by that many bytes for the key
   32bit unsigned value length followed by that many bytes for the value
   repeat key/value 'count' times.
   */

  var obj = {};
  var lastSeqNr = buf.readUInt32BE(0);
  var pairCount = buf.readUInt32BE(4);

  api.logger.debug('[' + this.config.name + '] Data frame nr:', lastSeqNr);

  var offset = 8;
  var dataLength, key, val;

  // map key-val to json
  while(pairCount > 0) {
    dataLength = buf.readUInt32BE(offset);
    offset += 4;
    key = buf.toString('utf8', offset, offset + dataLength);
    offset += dataLength;
    dataLength = buf.readUInt32BE(offset);
    offset += 4;
    val = buf.toString('utf8', offset, offset + dataLength);
    offset += dataLength;
    obj[key] = val;

    pairCount--;
  }

  // push obj to out-stream
  this.push(obj);

  // send ACK if necessarry
  this.dataFrameCounter++;
  if(this.dataFrameCounter >= this.windowSize) this._sendAck(lastSeqNr);

  if(buf.length > offset) {
    // there are more Data frames
    this._parser(buf.slice(offset), cb);
  } else {
    cb();
  }
};


Lumberjack.prototype._sendAck = function _sendAck(lastSeqNr) {
  api.logger.debug('[' + this.config.name + '] Sending ACK for frame nr:', lastSeqNr);

  this.dataFrameCounter = 0;
  var b = new Buffer(6);
  b.write('A',0, null,'ascii');
  b.writeUInt32BE(lastSeqNr, 1);
  this.config.inputStream.write(b);
};


api.parsers.lumberjack = function(config) {
  return new Lumberjack(config);
};