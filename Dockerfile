FROM node:18-alpine

COPY . /app

WORKDIR /app

ENTRYPOINT ["node", "scan.js"]