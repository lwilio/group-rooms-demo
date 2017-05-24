'use strict';

var Video = Twilio.Video;
var room;
var enableVideo = true;
var enableAudio = false; //Set to false for demo purposes. Set it to true if you want presenters to be able to chat
var numVideoTracks = 0;

window.addEventListener("load", function() {

    if(!DetectRTC.isWebRTCSupported){
      window.alert("This browser does not seem to support WebRTC. Please use Chrome or Firefox for opening this application");
      return;
    }

    var socket = io();
    socket.on('accessToken', connectToRoom);
    socket.emit('getAccessToken');

    //Support for only viewers: participats that don't publish new tracks but subscribe to existing tracks
    if (isViewer()) {
        enableVideo = false;
        enableAudio = false;
    }
});

function connectToRoom(msg) {
    console.log("Connecting to room " + msg.roomName + " with jwtToken: " + msg.jwtToken);
    Video.connect(msg.jwtToken, {
        name: msg.roomName,
        video: enableVideo,
        audio: enableAudio
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

function isViewer() {
    if (window.location.href.search("role=viewer") > 0) return true; //Common case for website
    if (window.location.href.search("role=presenter") > 0) return false; //Common case for website
    if (window.location.href.search("localhost") > 0) return false; //connecting from localhost makes you presenter by defult
    return true; //by default, viewer
}
