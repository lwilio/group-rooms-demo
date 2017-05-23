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


Now we should be all set! Run the application. For this, you must specify the protocol (i.e.
  http or https) and the port. Remember that, for security, Chrome will only allow
  you to activate your media capture devices (i.e. camera and video) when you connect
  from localhost or from an https secured connection.
```bash
node server.js https 8443
```
Where

Your application should now be running in all your network interfaces at the specified port

* For connecting as a full participant you may open [https://localhost:8443/](https://localhost:8443/)
* For connecting as only viewer participant you may open [https://localhost:8443/?role=viewer](https://localhost:8443/?role=viewer)

## License

MIT
