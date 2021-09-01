FROM node:14.17.6-alpine3.11

COPY . /app

WORKDIR /app

ENTRYPOINT ["node", "scan.js"]