# --- Build ---
FROM node:12-slim as dev
WORKDIR /app

COPY package.json yarn.lock tsconfig.json ./
RUN yarn install

COPY src/ src/
RUN yarn build

# --- Run ---
FROM node:12-alpine as prod
RUN apk add --no-cache tini yarn
WORKDIR /app
ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=dev /app/out /app/out
COPY package.json yarn.lock .env ./
RUN yarn install --production
CMD [ "yarn", "start" ]