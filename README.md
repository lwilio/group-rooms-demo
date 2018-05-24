# Twilio Group Rooms Demo

This application is a simple videoconferencing service created using Twilio's Programmable Video Group Rooms API. Before begin, we need to collect all the config values we need to run the application:

* Account SID: Your primary Twilio account identifier - find this [in the console here](https://www.twilio.com/console).
* API Key: Used to authenticate - [generate one here](https://www.twilio.com/console/video/dev-tools/api-keys).
* API Secret: Used to authenticate - [just like the above, you'll get one here](https://www.twilio.com/console/video/dev-tools/api-keys).

## A Note on API Keys

When you generate an API key pair at the URLs above, your API Secret will only
be shown once - make sure to save this in a secure location,
or possibly your `~/.bash_profile`.

## Setting Up The Application

Create a configuration file for your application:
```bash
cp env.template .env
```

Edit `.env` with the configuration parameters we gathered from above.

Next, we need to install our dependencies from npm:
```bash
npm install
```

Now, copy npm dependencies required by client.js:
```bash
npm run doCopy
```

##Running the room service

```bash
./ngrok http 8080
node roomServer.js my-room-name
```

## roomServer.js command line parameters

```bash
node roomServer.js room-name protocol port
```

* `room name`: the room  name. Defaults to a random string.
* `protocol`: protocol to be used (i.e. `http` or `https`). Defaults to http.
Remember that due to WebRTC security constraints:
      * When exposing the service through `ngrok` you must use `http`.
      * When exposing the service from a public IP, you must use `https`.
      * When only connecting from localhost, you may use `https`
* `port`: port to be used. Defaults to:
      * `8080` for `http`
      * `8443` for `https`

## Connecting to the room service

* For connecting as a full participant you may open [https://localhost:8443/](https://localhost:8443/)
* For connecting as only viewer participant you may open [https://localhost:8443/?enableVideo=false&enableAudio=false](https://localhost:8443/?enableVideo=false&enableAudio=false)
* For specifying a userName (your published tracks will be named upon it)
      [https://localhost:8443/?userName=alice](https://localhost:8443/?userName=alice)



## createComposition.js command line parameters

```bash
node createComposition.js room-sid layout options
```

* `room-sid`: the room SID to be composed.
* `layout`: we currently accept:
      * `grid`: for a grid layout.
      * `main-with-row`: for a layout comprising a main track and a bottom row.
      In this case, you must specify the main track name or SID as `option`.

## License

MIT
