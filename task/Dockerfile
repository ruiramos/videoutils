FROM node:alpine

RUN apk add  --no-cache ffmpeg

WORKDIR /app

COPY ./models ./models

COPY ./package.json ./
RUN npm install

COPY ./ ./

RUN npm run build
CMD ["npm", "start"]
