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

const fetchData = async () => {
  const headers = JSON.parse(fs.readFileSync("header.json", "utf8"));
  headers["Cookie"] = process.env.COOKIE;

  const itemId = process.env.ITEM_ID;
  const urlBase = process.env.URL_BASE;
  const url = `${urlBase.replace("${ITEM_ID}", itemId)}`;

  const response_base = await axios.get(`${url}1`, { headers: headers });
  const totalPage = response_base.data.model.paging.totalPages;
  console.log(`Total pages: ${totalPage}`);

  const allRecords = [];

  for (let i = 1; i <= totalPage; i++) {
    try {
      console.log(`Fetching page ${i} of ${totalPage}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await axios.get(`${url}${i}`, { headers: headers });
      const reviews = response.data.model.items;

      for (const review of reviews) {
        const cleanedContent = cleanText(review.reviewContent);
        if (!cleanedContent) {
          continue;
        }

        const rating = review.gradeItems.PRODUCT_REVIEW;
        if (!rating) {
          continue;
        }

        const record = `${rating},${cleanedContent}\n`;
        allRecords.push(record);
      }
    } catch (error) {
      console.error(`Error fetching page ${i}: ${error.message}`);
      writeRecordsToCSV(allRecords);
      return;
    }
  }

  if (allRecords.length > 0) {
    writeRecordsToCSV(allRecords);
  }
};

await fetchData();
