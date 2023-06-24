FROM node:16 AS api 

WORKDIR /src

COPY ./packages/api/package*.json ./
RUN npm ci

COPY ./packages/api .

RUN npm run build

############

FROM node:16 AS www

WORKDIR /src

COPY ./packages/www/package*.json ./
RUN npm ci

COPY ./packages/www ./

RUN npm run build

############

FROM node:16 AS auth 

WORKDIR /src

COPY ./packages/auth/package*.json ./
RUN npm ci

COPY ./packages/auth ./

RUN npm run build

############

FROM node:16 AS app 

WORKDIR /src

COPY ./packages/app/package*.json ./
RUN npm ci

COPY ./packages/app ./

RUN npm run build

############

FROM node:16-buster-slim

RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y openssl sqlite3

WORKDIR /src

COPY --from=api /src/build /src
COPY --from=www /src/build /src/public/www
COPY --from=auth /src/build /src/public/auth
COPY --from=app /src/build /src/public/app

RUN npm install

EXPOSE 443
CMD [ "npm", "start" ]
