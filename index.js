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

const fetchData = async () => {
  const headers = JSON.parse(fs.readFileSync("header.json", "utf8"));
  headers["Cookie"] = process.env.COOKIE;

  const itemId = process.env.ITEM_ID;
  const urlBase = process.env.URL_BASE;
  const url = `${urlBase.replace("${ITEM_ID}", itemId)}`;
  console.log(`Fetching reviews for item ${itemId} from ${url}`);

  const response_base = await axios.get(`${url}1`, { headers: headers });
  const toalPages = response_base.data.model.paging.totalPages;
  console.log(`Total pages: ${toalPages}`);

  const allRecords = [];

  for (let i = 1; i <= toalPages; i++) {
    try {
      console.log(`Fetching page ${i} of ${toalPages}`);

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
    }
  }

  const csvContent = allRecords.join("");

  fs.writeFileSync("reviews.csv", csvContent, "utf8");
};

await fetchData();
