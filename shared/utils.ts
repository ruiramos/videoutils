import { RedisClientType } from "redis";
import { Job, JobStatus } from "./types";

export function _updateJobStatus(id: string, redisClient: RedisClientType) {
  return (status: JobStatus, job?: Job) => {
    redisClient.set(`job:${id}`, status);

    if (!job) return;

    if (status === "done") {
      let jobStr = JSON.stringify(job);
      redisClient.lRem("vprocessing", 0, jobStr);
      redisClient.rPush("vdone", jobStr);
    } else if (status === "error") {
      let jobStr = JSON.stringify(job);
      redisClient.lRem("vprocessing", 0, jobStr);
      redisClient.rPush("verror", jobStr);
    }
  };
}
