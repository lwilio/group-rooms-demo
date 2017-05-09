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

Now we should be all set! Run the application:
```bash
npm start
```
Your application should now be running in all your network interfaces at port :3000

* For connecting as a full participant you may open [https://localhost:3000/](https://localhost:3000/)
* For connecting as only viewer participant you may open [https://localhost:3000/?role=onlyViewer](https://localhost:3000/?role=onlyViewer)

## License

MIT
