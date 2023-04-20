FROM node:20-alpine

COPY . /app

WORKDIR /app

ENTRYPOINT ["node", "scan.js"]