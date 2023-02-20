import { createClient } from "redis";
import { removeBgNoise } from "./utils.js";
import * as Minio from "minio";
import * as dotenv from "dotenv";
import typia from "typia";

import type { Job } from "videoutils-shared/types";

dotenv.config();

const { MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY } =
  process.env;

if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
  console.error("MinIO env variables not set");
  process.exit(1);
}

var minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT ? parseInt(MINIO_PORT) : 9000,
  useSSL: MINIO_ENDPOINT !== "localhost",
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
  process.exit(1);
});

await redisClient.connect();

while (true) {
  // get message from queue
  const job = await redisClient.lPop("vq");

  if (job) {
    const jobData: Job = JSON.parse(job);

    console.log(`Got new task: ${job}`);

    try {
      typia.assert<Job>(jobData);
    } catch (e) {
      console.error(`Job data not conformant to spec: ${e}`);
      redisClient.set(`job:${jobData.id}`, "error");
      continue;
    }

    redisClient.set(`job:${jobData.id}`, "processing");

    const inputPath = `/tmp/${jobData.fileIn}`;
    const outputPath = `/tmp/${jobData.fileOut}`;

    try {
      const file = await minioClient.fGetObject(
        jobData.bucketIn,
        jobData.fileIn,
        inputPath
      );
    } catch (e) {
      console.error(e);
      redisClient.set(`job:${jobData.id}`, "error");
      continue;
    }

    // process file
    try {
      await removeBgNoise(
        inputPath,
        outputPath,
        getModelPath(jobData.model),
        (progress: number) => {
          redisClient.set(`job:${jobData.id}:progress`, progress.toString());
        }
      );
    } catch (e) {
      console.error(e);
      redisClient.set(`job:${jobData.id}`, "error");
      continue;
    }

    try {
      await minioClient.fPutObject(
        jobData.bucketOut,
        jobData.fileOut,
        outputPath
      );
    } catch (e) {
      console.error(e);
      continue;
    }

    // TODO errors and EX
    redisClient.set(`job:${jobData.id}`, "done");
    redisClient.set(`job:${jobData.id}:file`, jobData.fileOut);
  } else {
    console.log("sleeping for a while... zzz");
    await new Promise((r) => setTimeout(r, 5000));
  }
}

// utils
function getModelPath(model = "RecordingSpeech") {
  const defaultModel = "somnolent-hogwash-2018-09-01/sh.rnnn";
  switch (model) {
    case "GeneralGeneral":
      return "marathon-prescription-2018-08-29/mp.rnnn";

    case "GeneralVoice":
      return "leavened-quisling-2018-08-31/lq.rnnn";

    case "RecordingGeneral":
      return "conjoined-burgers-2018-08-28/cb.rnnn";

    case "RecordingVoice":
      return "beguiling-drafter-2018-08-30/bd.rnnn";

    case "RecordingSpeech":
      return "somnolent-hogwash-2018-09-01/sh.rnnn";

    default: {
      console.warn(
        `Invalid model supplied: ${model}, using the default: ${defaultModel}`
      );
      return defaultModel;
    }
  }
}
