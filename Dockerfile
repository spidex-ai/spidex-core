FROM node:20-alpine AS build
WORKDIR /app


COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

RUN yarn build


EXPOSE 3000