'use strict'


//Load configuration from .env config file
require('dotenv').load();


/*********************************************************************
INTERESTING STUFF STARTS BELOW THIS LINE
**********************************************************************/

var ACCOUNT_SID = process.env.ACCOUNT_SID; //Get yours here: https://www.twilio.com/console
var API_KEY_SID = process.env.API_KEY_SID; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys
var API_KEY_SECRET = process.env.API_KEY_SECRET; //Get yours here: https://www.twilio.com/console/video/dev-tools/api-keys

const Twilio = require('twilio');
const client = new Twilio(API_KEY_SID, API_KEY_SECRET, {
  accountSid: ACCOUNT_SID
});

var compositionSid = process.argv[2];
if(!compositionSid){
  console.log("You must specify a CompositionSid");
  process.exit(-1);
}

client.video.compositions(compositionSid).fetch()
  .then(composition => {

    if (composition.status == 'processing') {
      console.log('The composition is still processing. Try in a few minutes ...')
    } else if (composition.status == 'completed') {
      fetchMediaUrl()
    } else if (composition.status == 'failed') {
      console.log('The composition failed')
    } else if (composition.status == 'deleted') {
      console.log('The composition was deleted')
    }

  })
  .catch(error => {
    console.log("Error reading composition " + error);
  })

function fetchMediaUrl() {
  const request = require('request');

  const uri = 'https://video.twilio.com/v1/Compositions/' + compositionSid + '/Media?Ttl=6000';

  client.request({
      method: 'GET',
      uri: uri
    })
    .then(response => {
      const mediaLocation = JSON.parse(response.body).redirect_to;
      console.log('You can fetch the media file in this URL:');
      console.log(mediaLocation);
    })
    .catch(error => {
      console.log("Error fetching /Media resource " + error);
    });
}
