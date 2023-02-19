/**
  This thing will have to:

  1. receive the uploaded file
  2. do some checks
  3. upload to minio
  4. add job to queue
  return some id that allows the user to download the file?
**/

import type { NextApiRequest, NextApiResponse, PageConfig } from "next";
import path from "path";
import busboy from "busboy";
import * as Minio from "minio";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";

import type { Job } from "videoutils-shared/types";

const {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_IN_BUCKET_NAME,
  MINIO_OUT_BUCKET_NAME,
} = process.env;

type Response =
  | {
      error: string;
    }
  | {
      message: string;
      id: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
    console.error("MinIO env variables not set");
    res.status(500).end();
    return;
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
    // TODO is this right?
    res.status(500).send({ error: err.message });
    throw err;
  });

  await redisClient.connect();

  const bucketName = MINIO_IN_BUCKET_NAME || "videos";

  try {
    if (!(await minioClient.bucketExists(bucketName))) {
      console.error("Minio bucket not found");
      res.status(500).send({ error: "Storage service not ready" });
      return;
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Storage service not available" });
    return;
  }

  // create new task id
  const taskId = uuidv4();

  // create job status key on redis - set to uploading
  redisClient.set(`job:${taskId}`, "uploading");

  const bb = busboy({ headers: req.headers });
  let inFilename: string;
  let outFilename: string;
  let originalFilename: string;

  bb.on("file", async (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    console.log(
      `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
      filename,
      encoding,
      mimeType
    );

    // TODO validate file

    const filePath = path.parse(filename);
    const now = Date.now();
    inFilename = `${now}-${filePath.name}${filePath.ext}`;
    outFilename = `${now}-${filePath.name}-processed${filePath.ext}`;

    try {
      const object = await minioClient.putObject(bucketName, inFilename, file);
      console.log(object);
      redisClient.set(`job:${taskId}`, "uploaded");
    } catch (e) {
      res.status(500).send({
        error: e instanceof Error ? e.message : "Error uploading file",
      });
      return;
    }
  });

  bb.on("field", (name, val, info) => {
    console.log(`Field [${name}]: value: %j`, val);
  });

  bb.on("finish", async () => {
    console.log("Done parsing form!");

    if (inFilename) {
      const job: Job = {
        id: taskId,
        bucketIn: bucketName,
        fileIn: inFilename,
        bucketOut: MINIO_OUT_BUCKET_NAME || "processed",
        fileOut: outFilename,
        type: "NoiseReduction",
      };

      await redisClient.lPush("vq", JSON.stringify(job));

      res.status(200).send({ message: "Success", id: taskId });
    } else {
      res.status(500).send({ error: "Couldn't find uploaded file" });
    }
  });

  req.pipe(bb);
}

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};
