# vncbot-for-Discord

## Installation
You will need Node.js, `git`, and a computer/VM with a running VNC server.
```bash
git clone https://github.com/joebobbio/vncbot-for-Discord
cd vncbot-for-Discord
npm i
cp vncbot.vncservers.example.json vncbot.vncservers.json
```
Then use the text editor of your preference to edit `vncbot.vncservers.json` to your needs.
Start the bot with `node main.js` (you can use a manager like PM2 to run in the background)
