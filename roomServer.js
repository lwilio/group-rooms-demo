'use strict'


//The typical utilities required for having things working
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const randomstring = require('randomstring');
const express = require('express');

//Load configuration from .env config file
require('dotenv').load();

//Import Twilio client library
const Twilio = require('twilio');

prepareCleanTermination()

//Load launch options from command line
var protocol = process.argv[3];
if (!protocol || (protocol != 'http' && protocol != 'https')) {
  protocol = 'http';
}

var port = parseInt(process.argv[4]);
if (!port || port < 1 || port > 65535) {
  port = protocol == 'https' ? 8443 : 8080;
}

//Set up our web server
var app = express();
var publicpath = path.join(__dirname, "./public");
app.use("/", express.static(publicpath));

var server;

if (protocol == 'https') {
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

const ACCOUNT_SID = process.env.ACCOUNT_SID; //Get yours here: https://www.twilio.com/console
const API_KEY_SID = process.env.API_KEY_SID; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys
const API_KEY_SECRET = process.env.API_KEY_SECRET; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys

const client = new Twilio(API_KEY_SID, API_KEY_SECRET, {
  accountSid: ACCOUNT_SID
});

var roomSid;
var roomName = process.argv[2];
if (!roomName) {
  roomName = randomstring.generate(10);
}


console.log('Trying to create room ' + roomName);
client.video.rooms
  .create({
    type: 'group',
    uniqueName: roomName,
    recordParticipantsOnConnect: true
  })
  .then(room => {
    roomSid = room.sid;
    console.log('Room ' + room.uniqueName + ' created successfully');
    console.log('RoomSid=' + room.sid);
    console.log('Room ' + roomName + ' ready to receive client connections');
  })
  .catch(error => {
    console.log('Error creating room ' + error);
    process.exit(-1);
  });

//AccessToken management
//Twilio's utilities for having AccessTokens working.
var AccessToken = Twilio.jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;

io.on('connection', function(socket) {

  //Client ask for an AccessToken. Generate a random identity and provide it.
  socket.on('getAccessToken', function(msg) {

    console.log("getAccessToken request received");

    var userName;
    if (msg && msg.userName) {
      userName = msg.userName;
    } else {
      userName = randomstring.generate(20);
    }

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

/*This function makes the cleanup upon program termination. This cleaup includes
completing the room if it's still active. Otherwise, the room will stay alive
for 5 minutes after all participants disconnect.*/
function prepareCleanTermination() {
  process.stdin.resume(); //so the program will not close instantly
  //do something when app is closing
  process.on('exit', exitHandler.bind(null, {
    cleanup: true
  }));
  //catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, {
    exit: true
  }));
  //catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, {
    exit: true
  }));

  function exitHandler(options, err) {
    if (roomSid) {
      client.video.rooms(roomSid)
        .update({
          status: 'completed'
        })
        .then(room => {
          console.log('Room ' + roomSid + ' completed');
          if (options.exit) process.exit();
        })
        .catch(error => {
          if (options.exit) process.exit();
        })
    }
  }
}
