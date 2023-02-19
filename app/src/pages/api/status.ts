import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "redis";
import * as Minio from "minio";

type Data =
  | {
      error: string;
    }
  | { status: string }
  | any;

const {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_OUT_BUCKET_NAME,
} = process.env;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { id } = req.query;

  if (
    !MINIO_ENDPOINT ||
    !MINIO_ACCESS_KEY ||
    !MINIO_SECRET_KEY ||
    !MINIO_OUT_BUCKET_NAME
  ) {
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
  });

  await redisClient.connect();

  const status = await redisClient.get(`job:${id}`);

  if (!status) {
    res.status(404).json({ error: "Video not found" });
  } else {
    res.status(200).json({ status });
  }
}
