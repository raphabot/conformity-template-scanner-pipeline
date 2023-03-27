FROM node:19-alpine

COPY . /app

WORKDIR /app

ENTRYPOINT ["node", "scan.js"]