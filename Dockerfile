FROM node:12-slim
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN yarn

COPY .env ./
COPY index.js index.js

CMD [ "npm", "start" ]
