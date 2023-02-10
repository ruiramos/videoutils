import { createClient } from "redis";
import { addJobToQueue } from "./utils.js";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
const argv = yargs(hideBin(process.argv)).argv;

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();

await addJobToQueue(
  redisClient,
  removeUndef({
    input: argv.input || "videos/test1.mp4",
    output: argv.output || "videos/processed.mp4",
    model: argv.model,
  })
);

redisClient.disconnect();

function removeUndef(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key]) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}
