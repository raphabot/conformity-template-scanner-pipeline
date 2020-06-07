FROM node:lts-alpine

COPY . /app

WORKDIR /app

ENTRYPOINT ["node", "scan.js"]