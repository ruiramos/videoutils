import { RedisClientType } from "redis";
import { JobStatus } from "./types";

export function _updateJobStatus(taskId: string, redisClient: RedisClientType) {
  return (status: JobStatus) => {
    // TODO EX
    redisClient.set(`job:${taskId}`, status);
  };
}
