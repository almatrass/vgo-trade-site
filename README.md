# vgo-trade-site
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/almatrass/vgo-trade-site/blob/master/LICENSE)
***

vgo-trade-site is a simple trading site for VGO, build to show off the WAX Expresstrade API.

You can view an example of the site here: http://trade.gain.gg.

You can support my projects by using my DigitalOcean referral link (bonus $10 when you deposit $5): https://m.do.co/c/126d9f75d958

You may use the site for commercial purposes free of charge.

### Setup
#### Video tutorial
You can find a video tutorial here: https://www.youtube.com/watch?v=u7EyEQszX94

#### Quick local setup
First, make sure you have node.js installed, which you can do here: https://nodejs.org/

The site is extremely easy to get up and running. 
First, download ZIP, and extract it (I'll extract to my documents)

Then, open CMD (for Windows), or Terminal (Max/Linux), and change to the vgo-trade-site-master directory:
```bash
$ cd /Users/Almatrass/Documents/vgo-trade-site-master
```

Now, open the config file in a text editor: 

```bash
$ open ./config/config.js
```

All the config stuff is commented nicely, and you shouldn't have too much bother with it. 
The only important things are the `opskinsApiKey`, `opskinsSecret` and `returnUrl` values.

##### returnUrl
The `returnUrl` value should stay the same if running locally.
Make sure to include the port if it's not 80 or 443.

```js
returnUrl: 'http://localhost/auth/opskins/authenticate'
// Becomes
returnUrl: 'http://382.73.93.763:4073/auth/opskins/authenticate'
```

##### opskinsApiKey and opskinsSecret
You can find your OPSkins API key on the OPSkins website in your advanced options of your account.

To access the secret, you need to setup 2FA on your account with a program that supports secret exports.

You can find one for Chrome here: https://chrome.google.com/webstore/detail/authenticator/bhghoamapcdpbohphigoooaddinpkbai.

Consult the video tutorial if you're still having problems.

The API and secret values are used for the account sending the bot trades.

The API key is also used for OPSkins login.

All other config stuff is optional for the functionality of the site, but look through it and edit what you like.

#### Install modules
You should still be in the directory you have your site, in my case `/Users/Almatrass/Documents/vgo-trade-site-master`

Run
```bash
$ npm i
```

Now you're ready, run:
```bash
$ npm start
```

Visit 'localhost' in your browser, and the site should be fully functional.

### Deploying to VPS
First step is creating a VPS. You can do this with a site like DigitalOcean.

You will receive a bonus $10 when you deposit $5 if you use my referral link here: https://m.do.co/c/126d9f75d958

Refer to the video tutorial for creating a new droplet.

Once the droplet is created, you will need two programs: Filezilla and PuTTY (or a built-in SSH client).

First, use Filezilla to logon to the server, then switch to your `/` directory.

Create a new directory called `vgo-trade`, or whatever you like, then enter it. 

You can do this from your console if you prefer
```bash
$ mkdir /vgo-trade
```

At this point you want to move all the files into this directory from your local machine, but be sure to omit the node modules folder, or this will take forever.

Now login via PuTTY, and change into the directory.
```bash
$ cd /vgo-trade
```
Run `pwd` to check where you are, if all is good, you'll see this:
```bash
/vgo-trade
```

Now you can run
```bash
$ npm i
```
again to install the node modules.

Before spawning our process forever, test if the server is working, by running:
```bash
$ node ./server/index.js
```

Visit your IP address in a browser, and you should see the site.

We will now use PM2 to keep our process running forever:
```bash
$ npm i -g pm2
```

The `-g` argument means the package will be installed globally, so we can use it anywhere on our system for other projects later!

Now, in your `/vgo-trade` directory, you can simply run:
```bash
$ pm2 start ./server/index.js
```

To view process logs at anytime, you can logon to your VPS and run
```bash
$ pm2 logs index
```

If your node server crashes, PM2 will automatically spawn a new process.

If your droplet crashes or reboots, simply come back on and spawn the process again:
```bash
$ pm2 start /vgo-trade/server/index.js
```
or
```bash
$ cd /vgo-trade
$ pm2 start ./server/index.js
```

### Editing the code
All HTML files are located in the `views` directory.

All public files (js, css and images)  are located in the `public` directory.

All the backend code is located in the `server` directory.

Please open an issue if you discover any bugs.