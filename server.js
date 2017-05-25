'use strict'


//The typical utilities required for having things working
var fs = require('fs');
var https = require('https');
var http = require('http');
var path = require('path');
var randomstring = require('randomstring');
var unirest = require('unirest');
var express = require('express');

//Load configuration from .env config file
require('dotenv').load();

//Load launch options from command line
var protocol = process.argv[2];
if(!protocol || (protocol != 'http' && protocol != 'https')){
  protocol = 'http';
}

var port = parseInt(process.argv[3]);
if(!port || port < 1 || port > 65535){
  port = protocol == 'https' ? 8443 : 8080;
}

//Set up our web server
var app = express();
var publicpath = path.join(__dirname, "./public");
app.use("/", express.static(publicpath));

var server;

if(protocol == 'https'){
  var httpsOptions = {
      key: fs.readFileSync('keys/server.key'),
      cert: fs.readFileSync('keys/server.crt')
  };
  server = https.createServer(httpsOptions, app);
} else {
  server = http.createServer(app);
}

server.listen(port, function() {
    console.log("Express server listening for " + protocol + " on *:" + port);
});

var io = require('socket.io')(server);

/*********************************************************************
INTERESTING STUFF STARTS BELOW THIS LINE
**********************************************************************/

//Create a room with a random name
//Warning: this room will only exist for 5 minutes.

var ACCOUNT_SID = process.env.ACCOUNT_SID; //Get yours here: https://www.twilio.com/console
var API_KEY_SID = process.env.API_KEY_SID; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys
var API_KEY_SECRET = process.env.API_KEY_SECRET; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys

var roomName = randomstring.generate(10);
var request = unirest.post('https://video.twilio.com/v1/Rooms')
    .send("Type=group") //Type=peer-to-peer | Type=group
    .send("UniqueName=" + roomName)
    .send("RecordParticipantsOnConnect=false");
request.auth({
    user: API_KEY_SID,
    pass: API_KEY_SECRET,
    sendImmediately: true
});

console.log("Creating room launching REST request to https://video.twilio.com/v1/Rooms");

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
var AccessToken = require('twilio').jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;

io.on('connection', function(socket) {

    //Client ask for an AccessToken. Generate a random identity and provide it.
    socket.on('getAccessToken', function(msg) {

        console.log("getAccessToken request received");

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
            jwtToken: accessToken.toJwt(),
            roomName: roomName
        }

        console.log("JWT accessToken generated: " + accessToken.toJwt() + "\n");

        socket.emit("accessToken", answer);
    });
});
