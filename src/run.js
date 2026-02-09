import crawl from "./script.js"
import * as fs from "fs";

let start = "http://localhost:5500";



await crawl(start);
fs.writeFileSync('index.json', JSON.stringify(rawdata, null, 2));