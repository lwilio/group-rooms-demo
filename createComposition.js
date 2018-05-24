'use strict'

const apiKeySid = process.env.API_KEY_SID; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys
const apiKeySecret = process.env.API_KEY_SECRET; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys
const accountSid = process.env.ACCOUNT_SID; //Get yours here: https://www.twilio.com/console
const Twilio = require('twilio');

const client = new Twilio(apiKeySid, apiKeySecret, {accountSid: accountSid});

var roomSid = process.argv[2];

if(!roomSid){
  console.log("You must specify RoomSid your want to compose");
  process.exit(-1);
}

var layout = process.argv[3]
var mainVideo;
if(!layout){
  layout = 'grid'
} else if (layout == 'main-with-row'){
  mainVideo = process.argv[4]
  if(!mainVideo){
    console.log('You must specify a "mainVideo" TrackName or TrackSID when using "main-with-row" layout');
  }
}

var videoLayout;
if(layout == 'grid'){
  videoLayout = {
    grid: {
      video_sources: ['*']
    }
  }
} else if(layout == 'main-with-row'){
  videoLayout = {
    main: {
      z_pos: 1,
      video_sources: [mainVideo]
    },
    row: {
      z_pos: 2,
      x_pos: 10,
      y_pos: 530,
      width: 1260,
      height: 160,
      max_rows: 1,
      video_sources: ['*'],
      video_sources_excluded: [mainVideo]
    }
  }
}

client.video.compositions.
  create({
    roomSid: roomSid,
    audioSources: '*',
    videoLayout: videoLayout,
    resolution: '1280x720',
    format: 'mp4'
  })
  .then(composition =>{
    console.log("Created Composition with SID=" + composition.sid);
  })
  .catch(error =>{
    console.log("Error creating composition " + error);
  })
