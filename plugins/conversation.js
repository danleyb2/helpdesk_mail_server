const axios = require('axios');


exports.hook_rcpt = function (next, connection, params) {
    var plugin = this;


    var transaction = connection.transaction;
    var emailTo = transaction.rcpt_to;

    var gzip = zlib.createGzip();
    var transformer = plugin.zipBeforeUpload ? gzip : new TransformStream();
    var body = transaction.message_stream.pipe(transformer);

    var s3 = new AWS.S3();

    var addresses = plugin.copyAllAddresses ? transaction.rcpt_to : transaction.rcpt_to[0];

    async.each(addresses, function (address, eachCallback) {
        var key = address.user + "@" + address.host + "/" + transaction.uuid + plugin.fileExtension;

        var params = {
            Bucket: plugin.s3Bucket,
            Key: key,
            Body: body
        };

        s3.upload(params).on('httpUploadProgress', function (evt) {
            plugin.logdebug("Uploading file... Status : " + util.inspect(evt));
        }).send(function (err, data) {
            plugin.logdebug("S3 Send response data : " + util.inspect(data));
            eachCallback(err);
        });
    }, function (err) {
        if (err) {
            plugin.logerror(err);
            next();
        } else {
            next(OK, "Email Accepted.");
        }
    });

    // --
    var rcpt = params[0];

    plugin.loginfo(params[0]);
    plugin.loginfo(params[1]);
    plugin.loginfo(params[2]);


    plugin.loginfo("Got recipient: " + rcpt);

    var data = {
        'contact':{

        },
        'subject':'',
        'message':'',
        'from':''

    };


    // forward message and id to right api endpoint
    axios.post('http://localhost:3000/api/mail/create', {
        firstName: 'Fred',
        lastName: 'Flintstone'
    })
        .then(function (response) {
            plugin.loginfo(response);
        })
        .catch(function (error) {
            plugin.loginfo(error);
        });

    next();
};
