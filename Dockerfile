FROM node:23.9.0

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# RUN echo "DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN" > .env.production.local \
#   && echo "DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET" >> .env.production.local

CMD ["npm", "start"]
