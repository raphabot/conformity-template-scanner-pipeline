FROM node:latest

RUN apt-get update -y

RUN git clone https://github.com/raphabot/conformity-template-scanner-pipeline.git

# RUN cd conformity-template-scanner-pipeline

RUN npm init -y

RUN npm install

