FROM node:20-alpine

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install --production --silent

COPY ./index.js /usr/src/app/

COPY ./species_dict.json /usr/src/app/

COPY ./files_scv_subset.txt /usr/src/app/

COPY ./add_to_sqlite.js /usr/src/app/



