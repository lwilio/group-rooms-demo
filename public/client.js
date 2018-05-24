'use strict';

var Video = Twilio.Video;
var room;
var enableVideo = true; //default. Set to false for broadcasting apps
var enableAudio = true; //default. Set to false for avoiding echoes in demos
var numVideoTracks = 0;
var userName;

window.addEventListener("load", function() {

  if (!DetectRTC.isWebRTCSupported) {
    window.alert("This browser does not seem to support WebRTC. Please use Chrome or Firefox for opening this application");
    return;
  }

  //Set options based on query-string parameters
  userName = getParameterByName('userName');
  if(getParameterByName('enableAudio')){
    enableAudio = getParameterByName('enableAudio') == 'true';
  }
  if(getParameterByName('enableVideo')){
    enableVideo = getParameterByName('enableVideo') == 'true';
  }

  //Request access token and wait for it
  var socket = io();
  socket.on('accessToken', connectToRoom);
  if (userName) {
    socket.emit('getAccessToken', {
      userName: userName
    });
  } else {
    socket.emit('getAccessToken');
  }
});

function connectToRoom(msg) {

  var videoOptions = false;
  if(enableVideo){
    if (userName) {
      videoOptions = {
        name: userName + "-video"
      }
    } else {
      videoOptions = true;
    }
  }

  var audioOptions = false;
  if (enableAudio) {
    if (userName) {
      audioOptions = {
        name: userName + "-audio"
      }
    } else {
      audioOptions = true;
    }
  }

  console.log("Connecting to room " + msg.roomName + " with jwtToken: " + msg.jwtToken);
  Video.connect(msg.jwtToken, {
    name: msg.roomName,
    video: videoOptions,
    audio: audioOptions
  }).then(function(room) {

    window.room = room;

    //Display local tracks, if any
    console.log("Attaching local tracks");
    room.localParticipant.tracks.forEach(function(track) {
      if (track.kind == "audio") return; //Typically, I don't want to listen my own audio
      var mediaElement = track.attach();
      document.getElementById('divLocalVideoContainer').appendChild(mediaElement);
    });

    //Display currently connected participants' tracks, if any
    console.log("Managing pre-existing participants");
    room.participants.forEach(function(participant) {
      participant.tracks.forEach(attachTrack);
      manageConnectedParticipant(participant);
    });

    //Add handlers for managing participants events
    room.on('participantConnected', manageConnectedParticipant);
    room.on('participantDisconnected', manageDisconnectedParticipant);
    room.on('disconnected', manageDisconnected)

    updateNumParticipants();
  });
}

function manageConnectedParticipant(participant) {
  console.log("Participant " + participant.identity + " connected");
  participant.on('trackAdded', attachTrack);
  participant.on('trackRemoved', detachTrack);
  updateNumParticipants();
}

function manageDisconnectedParticipant(participant) {
  console.log("Participant " + participant.identity + " disconnected");
  participant.tracks.forEach(detachTrack);
  updateNumParticipants();
}

function manageDisconnected(room, error){
  if(error){
      console.log("Disconnect error: " + error);
  }

  room.participants.forEach(function(participant) {
    manageDisconnectedParticipant(participant);
  })

  room.localParticipant.tracks.forEach(function(track){
    track.stop();
    detachTrack(track);
    updateNumParticipants()
  });
}

function attachTrack(track) {
  var mediaElement = track.attach();
  document.getElementById('divRemoteVideoContainer').appendChild(mediaElement);
  if (track.kind == 'video') updateDisplay(1);
}

function detachTrack(track) {
  track.detach().forEach(function(el) {
    el.remove();
  });
  if (track.kind == 'video') updateDisplay(-1)
}

function updateNumParticipants() {
  var labelNumParticipants = document.getElementById('labelNumParticipants');
  labelNumParticipants.innerHTML = room.participants.size + 1;
}

function updateDisplay(num) {
  numVideoTracks += num;
  var videoTagWidth = 100 / (1 + numVideoTracks);

  var remoteVideoTags = document.querySelectorAll("#divRemoteVideoContainer video")
  remoteVideoTags.forEach(function(videoTag) {
    videoTag.style.width = +videoTagWidth + '%';
  });
}

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
