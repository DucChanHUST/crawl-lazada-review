FROM node:16
WORKDIR /crawl-lazada-review
COPY . .
RUN npm install
CMD ["node", "index.js"]
