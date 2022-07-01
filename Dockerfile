FROM node:16.13.0-alpine3.11

COPY . /app

WORKDIR /app

ENTRYPOINT ["node", "scan.js"]