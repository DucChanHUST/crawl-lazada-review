FROM node:16

WORKDIR /crawl-lazada-review

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "index.js"]
