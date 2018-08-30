FROM node:10-alpine

LABEL name "Asashio"
LABEL version "0.1.0"
LABEL maintainer "iCrawl <icrawltogo@gmail.com>"

WORKDIR /usr/src/asashio

COPY package.json yarn.lock ./

RUN apk add --update \
&& apk add --no-cache ca-certificates \
&& apk add --no-cache --virtual .build-deps git curl \
&& yarn install \
&& apk del .build-deps

COPY . .

ENV NODE_ENV= \
	PORT= \
	DOMAIN= \
	CORS_ORIGINS= \
	JWT_SECRET= \
	DISCORD_CLIENT_ID= \
	DISCORD_CLIENT_SECRET= \
	DISCORD_CALLBACK_DOMAIN= \
	DISCORD_CALLBACK_PORT= \
	DISCORD_CALLBACK_ROUTE= \
	DISCORD_SCOPES=

CMD ["node", "src/index.js"]
