'use strict'


//The typical utilities required for having things working
var fs = require('fs');
var https = require('https');
var path = require('path');
var randomstring = require('randomstring');
var unirest = require('unirest');
var express = require('express');

//Load configuration from .env config file
require('dotenv').load();

//Set up our web server
var app = express();
var publicpath = path.join(__dirname, "./public");
app.use("/", express.static(publicpath));

var httpsOptions = {
    key: fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt')
};

var server = https.createServer(httpsOptions, app);
var port = 3000;
server.listen(port, function() {
    console.log("Express server listening on *:" + port);
});

var io = require('socket.io')(server);


//Create a room with a random name
//Warning: this room will only exist for 5 minutes.

var ACCOUNT_SID = process.env.ACCOUNT_SID; //Get yours here: https://www.twilio.com/console
var API_KEY_SID = process.env.API_KEY_SID; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys
var API_KEY_SECRET = process.env.API_KEY_SECRET; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys

var roomName = randomstring.generate(10);
var request = unirest.post('https://video.twilio.com/v1/Rooms')
    .send("Type=group")
    .send("UniqueName=" + roomName)
    .send("RecordParticipantsOnConnect=false");
request.auth({
    user: API_KEY_SID,
    pass: API_KEY_SECRET,
    sendImmediately: true
});

request.end(function(response) {
    if (response.error) {
        console.log("Error creating room " + response.error)
        process.exit(-1);
    }

    if (response.ok) {
        console.log("Room " + response.body.unique_name + " successfully created");
        console.log("Room  " + roomName + " ready to receive client connections");
    } else {
        console.log("Error creating room" + response.body);
        process.exit(-1);
    }
});


//AccessToken management

//Twilio's utilities for having AccessTokens working.
var AccessToken = require('Twilio').jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;

io.on('connection', function(socket) {

    //Client ask for an AccessToken. Generate a random identity and provide it.
    socket.on('getAccessToken', function(msg) {

        var userName = randomstring.generate(20);

        var accessToken = new AccessToken(
            ACCOUNT_SID,
            API_KEY_SID,
            API_KEY_SECRET
        );

        accessToken.identity = userName;

        var grant = new VideoGrant();
        grant.room = roomName;
        accessToken.addGrant(grant);

        var answer = {
            jwtToken: accessToken.toJwt()
        }
        socket.emit("accessToken", answer);
    });
});
