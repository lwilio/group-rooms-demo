'use strict';

var Video = Twilio.Video;
var room;
var enableVideo = true;
var enableAudio = true;
var numVideoTracks = 0;

window.addEventListener("load", function() {

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
        video: enableAudio,
        audio: enableVideo
    }).then(function(room) {

        window.room = room;
        updateNumParticipants();

        //Display local tracks, if any
        room.localParticipant.tracks.forEach(function(track) {
            var mediaElement = track.attach();
            document.getElementById('divLocalVideoContainer').appendChild(mediaElement);
        });

        //Display currently connected participants' tracks, if any
        room.participants.forEach(function(participant) {
            participant.tracks.forEach(attachTrack);
            manageParticipant(participant);
        });

        //Add handlers for managing participants events
        room.on('participantConnected', manageParticipant);
        room.on('participantDisconnected', onParticipantDisconnected);
    });
}

function manageParticipant(participant) {
    console.log("Participant " + participant.identity + " connected");
    participant.on('trackAdded', attachTrack);
    participant.on('trackRemoved', detachTrack);
    updateNumParticipants();
}

function onParticipantDisconnected(participant) {
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
    if (window.location.href.search("role=onlyViewer") > 0) return true; //Common case for website
    if (window.location.href.search("presenter.twilio-video.com") > 0) return false; //presenter.twilio-video.com demo
    if (window.location.href.search("twilio-video.com") > 0) return true; //rest of domains on twilio-video.com demo
    return false; //by default, presenter
}
