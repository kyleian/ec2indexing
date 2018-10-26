FROM node:8.11

ADD config.json config.json
ADD package.json package.json
ADD ec2indexing.js ec2indexing.js

RUN npm install
