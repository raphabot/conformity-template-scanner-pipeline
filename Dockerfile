FROM node:14.18.1-alpine3.11

COPY . /app

WORKDIR /app

ENTRYPOINT ["node", "scan.js"]