var util = require('util'),
    axios = require('axios'),
    async = require("async");

exports.register = function () {
    this.logdebug("Initializing AWS S3 Queue");

    var config = this.config.get("helpdesk-api.json");
    this.logdebug("Config loaded : " + util.inspect(config));

    this.helpdeskHost = config.helpdeskHost;
    this.fileExtension = config.fileExtension;
    this.copyAllAddresses = config.copyAllAddresses;
    this.validDomains = config.validDomains;
};

function streamToString(stream, cb) {
    const chunks = [];
    stream.on('data', (chunk) => {
        chunks.push(chunk.toString());
    });
    stream.on('end', () => {
        cb(chunks.join(''));
    });
}

exports.hook_queue = function (next, connection) {

    return next(OK, "Email Accepted.");

};
exports.hook_data = function (next, connection) {
    connection.transaction.parse_body = true;
    return next();
};


exports.hook_data_post = function (next, connection) {
    var plugin = this;
    connection.transaction.parse_body = 1;

    var transaction = connection.transaction;
    var emailTo = transaction.rcpt_to;
    plugin.loginfo(emailTo);

    var addresses = plugin.copyAllAddresses ? transaction.rcpt_to : transaction.rcpt_to[0];

    this.loginfo(connection.transaction.body.bodytext);
    this.loginfo(connection.transaction.body.body_text_encoded);
    this.loginfo(connection.transaction.body.children[0].bodytext);

    var data = {
        'subject': connection.transaction.header.get('subject'),
        'message': connection.transaction.body.children[0].bodytext,
        'from': connection.transaction.header.get('from'),
        'to': connection.transaction.header.get('to'),
    };

    this.loginfo(data);
    // forward message and id to right api endpoint
    axios.post(plugin.helpdeskHost + '/api/mail/receive', data)
        .then(function (response) {
            plugin.loginfo(response);
            next(OK, "Email Accepted.");

        })
        .catch(function (error) {
            plugin.logerror(error);
            next();
        });


};


exports.shutdown = function () {
    this.loginfo("Shutting down queue plugin.");
};
