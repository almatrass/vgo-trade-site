# vgo-trade-site
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/almatrass/FontEasy/blob/master/LICENSE.MD)
***

vgo-trade-site is a simple trading site for VGO, build to show off the WAX Expresstrade API.

You can view an example of the site here: https://trade.gain.gg

### Setup
#### Video tutorial
You can find a video tutorial here: (insert video URL here)

#### Quick setup
First, make sure you have node.js installed, which you can do here: https://nodejs.org/

The site is extremely easy to get up and running. 
First, download ZIP, and extract to your desktop.

Then, open CMD (for Windows), or Terminal (Max/Linux), and change to the vgo-trade-site-master directory:
```bash
> cd /Users/Almatrass/Desktop/vgo-trade-site-master
```

Once there, run:
```bash
> npm i
```

Now, open the config file in a text editor. All the config stuff is commented nicely, and you shouldn't have too much bother with it. The only important things are the `opskinsApiKey`, `opskinsSecret` and `returnUrl` values.

Now you're ready, run:
```bash
> npm start
```

Visit 'localhost' in your browser, and the site should be fully functional. 