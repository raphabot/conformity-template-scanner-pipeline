FROM node:latest

RUN apt-get update && apt-get upgrade -y &&rm -rf /var/lib/apt/lists/*

ADD . /usr/src/app

WORKDIR /usr/src/app

RUN npm install

ENTRYPOINT [ "node", "scan.js" ]

