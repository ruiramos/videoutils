import { RedisClientType } from "redis";
import { JobStatus } from "./types";

export function _updateJobStatus(taskId: string, redisClient: RedisClientType) {
  return (status: JobStatus) => {
    redisClient.set(`job:${taskId}`, status);

    if (status === "done") {
      redisClient.lRem("vprocessing", 0, taskId);
      redisClient.rPush("vdone", taskId);
    } else if (status === "error") {
      redisClient.lRem("vprocessing", 0, taskId);
      redisClient.rPush("verror", taskId);
    }
  };
}
