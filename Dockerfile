FROM node:latest

RUN apt-get update -y

RUN git clone https://github.com/raphabot/conformity-template-scanner-pipeline.git

RUN npm init -y

RUN npm install

