'use strict';

var Video = Twilio.Video;
var room;
var enableVideo = true;
var enableAudio = true;

window.addEventListener("load", function() {

    var socket = io();

    socket.on('accessToken', connectToRoom);

    socket.emit('getAccessToken');

    if (window.location.href.search("role=onlyViewer") > 0) {
        enableVideo = false;
        enableAudio = false;
    }
});

function connectToRoom(msg) {
    Video.connect(msg.jwtToken, {
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
            participant.tracks.forEach(function(track) {
                var mediaElement = track.attach();
                document.getElementById('divRemoteVideoContainer').appendChild(mediaElement);
            });
            onParticipantConnected(participant);
        });

        //Add handlers for managing participants events
        room.on('participantConnected', onParticipantConnected);
        room.on('participantDisconnected', onParticipantDisconnected);
    });
}

function onParticipantConnected(participant) {

    participant.on('trackAdded', function(track) {
        var mediaElement = track.attach();
        document.getElementById('divRemoteVideoContainer').appendChild(mediaElement);
    });

    participant.on('trackRemoved', function(track) {
        track.detach().forEach(function(el) {
            el.remove();
        });
    });

    updateNumParticipants();
}

function onParticipantDisconnected(participant) {
    participant.tracks.forEach(function(track) {
        track.detach().forEach(function(el) {
            el.remove();
        });
    });

    updateNumParticipants();
}

function updateNumParticipants() {
    var labelNumParticipants = document.getElementById('labelNumParticipants');
    labelNumParticipants.innerHTML = room.participants.size + 1;
}
