#broker_bot_app

Run in dev mode:

npm run serve

set webhooks:\
npx bottender telegram webhook set \
npx bottender viber webhook set

Or run as deamon:

start: pm2 start src/server.js \
stop: pm2 stop src/server.js \
restart: pm2 restart src/server.js \

npx bottender telegram webhook set \
npx bottender viber webhook set


