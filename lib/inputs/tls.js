/**
 * Input: tcpssl
 * listen for secured tcp connections sending data
 * @see http://devdocs.io/node/tls#tls_tls_createserver_options_secureconnectionlistener
 *
 * @param {string} ip          the bind ip
 * @param {int} port           the bind port, default: 6543
 * @param {string} cert        string containing the certificate key of the server in PEM format.
 * @param {string} key         string containing the private key of the server in PEM format.
 * @param {string} certFile    file containing the certificate key of the server in PEM format.
 * @param {string} keyFile     file containing the private key of the server in PEM format.
 * @param {string} ca          strings of trusted certificates in PEM format. If this is omitted several well known "root" CAs will be used, like VeriSign.
 * @param {string} caFile      file containing trusted certificates in PEM format.
 * @param {string} crl         string of PEM encoded CRLs (Certificate Revocation List)
 * @param {string} crlFile     file containing PEM encoded CRLs (Certificate Revocation List)
 * @param {string} pfx         string containing the private key, certificate and CA certs of the server in PFX or PKCS12 format.
 * @param {string} passphrase  string of passphrase for the private key or pfx.
 */

var api = require('../api.js');
var tls = require('tls');
var util = require('util');
var fs = require('fs');


api.inputs.tls = function(config, cb) {
  config.port = config.port || 6543;

  if(config.certFile) config.cert = fs.readFileSync(config.certFile);
  if(config.keyFile) config.key = fs.readFileSync(config.keyFile);
  if(config.caFile) config.ca = fs.readFileSync(config.caFile);
  if(config.crlFile) config.crl = fs.readFileSync(config.crlFile);

  var svr = tls.createServer({
    cert: config.cert,
    key: config.key,
    pfx: config.pfx,
    ca: config.ca,
    crtl: config.crl,
    passphrase: config.passphrase
  }, function(con) {
    var remoteAddr = con.remoteAddress;
    var remotePort = con.remotePort;
    api.logger.info('['+config.name+']', 'TLS connect from', remoteAddr + ':' + remotePort);

    con.on('end', function() {
      api.logger.info('['+config.name+']', 'TLS', remoteAddr + ':' + remotePort, 'disconnected');
    });

    con.on('error', function(err) {
      api.logger.error('[' + config.name + ']', 'TLS connection:', err.message);
    });

    cb(null, con);

  });

  api.logger.info('['+config.name+']', 'TLS server listening on', (config.ip || '0.0.0.0') + ':' + config.port);
  svr.listen(config.port, config.ip);
};

