import { createClient, RedisClientType } from "redis";
import { addJobToQueue } from "./utils.js";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import type { Model } from "videoutils-shared/types";

const argv = yargs(hideBin(process.argv))
  .options({
    model: { type: "string" },
    fileIn: { type: "string" },
    bucketIn: { type: "string" },
    fileOut: { type: "string" },
    bucketOut: { type: "string" },
  })
  .parseSync();

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();

const { fileIn, fileOut, bucketIn, bucketOut, model } = argv;

await addJobToQueue(redisClient as RedisClientType, {
  id: "123",
  fileIn: fileIn || "video1.mp4",
  fileOut: fileOut || "video1-processed.mp4",
  bucketIn: bucketIn || "videos",
  bucketOut: bucketOut || "processed",
  model: model as Model | undefined,
  type: "NoiseReduction",
});

redisClient.disconnect();
