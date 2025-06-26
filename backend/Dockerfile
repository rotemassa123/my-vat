FROM node:20.9.0-alpine as BUILDER
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:20.9.0-alpine as RUNNER

WORKDIR /app

COPY --from=BUILDER /app/dist ./dist

COPY package*.json ./

RUN npm install --omit=dev

EXPOSE 8080

CMD [ "node", "dist/src/main.js" ]
