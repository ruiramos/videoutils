FROM node:alpine

RUN apk add  --no-cache ffmpeg

WORKDIR /app

COPY ./models ./models

COPY ./package.json ./
RUN npm install

COPY ./ ./

CMD ["node", "index.js"]
