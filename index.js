import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const cleanText = (text) => {
  if (!text) {
    return "";
  }

  return text
    .replace(/,/g, "")
    .replace(/\n/g, " ")
    .replace(/[^\w\s\u00C0-\u1EF9.,!?]/g, " ")
    .trim();
};

const writeRecordsToCSV = (records) => {
  const csvContent = records.join("");
  fs.writeFileSync("reviews.csv", csvContent, "utf8");
};

const processReviews = (reviews, records, rate) => {
  for (const review of reviews) {
    const cleanedContent = cleanText(review.reviewContent);
    if (!cleanedContent) continue;

    let rating = review.gradeItems.PRODUCT_REVIEW;
    if (!rating) {
      rating = rate;
    }

    const record = `${rating},${cleanedContent}\n`;
    records.push(record);
  }
};

const randomDelay = () => {
  const min = 800;
  const max = 1500;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const fetchData = async () => {
  const headers = JSON.parse(fs.readFileSync("header.json", "utf8"));
  headers["Cookie"] = process.env.COOKIE;
  headers["x-csrf-token"] = process.env.CSRF_TOKEN;

  const itemId = process.env.ITEM_ID;
  const urlBase = process.env.URL_BASE;

  const allRecords = [];
  const rating = ["1", "2", "3", "4"];

  for (const rate of rating) {
    console.log(`Fetching reviews with rating ${rate}`);
    await new Promise((resolve) => setTimeout(resolve, randomDelay()));

    const url = urlBase
      .replace("${ITEM_ID}", itemId)
      .replace("${FILTER}", rate);

    try {
      const response_base = await axios.get(`${url}1`, { headers: headers });

      const reviews_base = response_base.data.model.items;
      const totalPage = response_base.data.model.paging.totalPages;

      console.log(`Fetching page 1 of ${totalPage}`);
      processReviews(reviews_base, allRecords, rate);

      for (let i = 2; i <= totalPage; i++) {
        console.log(`Fetching page ${i} of ${totalPage}`);
        await new Promise((resolve) => setTimeout(resolve, randomDelay()));

        const response = await axios.get(`${url}${i}`, { headers: headers });
        const reviews = response.data.model.items;

        processReviews(reviews, allRecords, rate);
      }
    } catch (error) {
      console.error(`Error fetching rate ${rate}: ${error.message}`);
      writeRecordsToCSV(allRecords);
      return;
    }
  }

  if (allRecords.length > 0) {
    writeRecordsToCSV(allRecords);
  }
};

await fetchData();
