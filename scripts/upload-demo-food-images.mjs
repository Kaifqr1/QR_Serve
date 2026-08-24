import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { storagePut } from "../server/storage.ts";

const imageNames = [
  "chicken-tikka-masala",
  "dal-makhani",
  "butter-chicken",
  "butter-chicken-rice",
  "paneer-tikka-masala",
  "paneer-tikka",
  "chicken-biryani",
  "mango-lassi",
  "rose-mocktail",
  "masala-chai",
  "kulfi-gulab-jamun",
  "garlic-naan",
];

const imageDirectory = "/home/ubuntu/webdev-static-assets/qrserve-demo-food";
const uploaded = {};

for (const imageName of imageNames) {
  const bytes = await readFile(resolve(imageDirectory, `${imageName}.jpg`));
  const result = await storagePut(
    `demo-menu/${imageName}.jpg`,
    bytes,
    "image/jpeg",
  );
  uploaded[imageName] = result.url;
}

console.log(JSON.stringify(uploaded, null, 2));
