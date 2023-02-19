import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { RedisClientType } from "redis";

export type Model =
  | "GeneralGeneral"
  | "GeneralVoice"
  | "RecordingGeneral"
  | "RecordingVoice"
  | "RecordingSpeech";

export interface Job {
  id: string;
  bucketIn: string;
  fileIn: string;
  bucketOut: string;
  fileOut: string;
  model?: Model;
}

export async function addJobToQueue(client: RedisClientType, task: Job) {
  const strTask = JSON.stringify(task);
  console.log(`Adding task to queue: ${strTask}`);
  return client.lPush("vq", strTask);
}

export async function processFile(
  filename: string,
  output: string,
  model = "somnolent-hogwash-2018-09-01/sh.rnnn"
) {
  return new Promise((resolve, reject) => {
    try {
      rmSync(output);
    } catch {}
    const ff = spawn("ffmpeg", [
      "-i",
      filename,
      "-af",
      `arnndn=m='models/${model}'`,
      output,
    ]);

    ff.stdout.on("data", (data) => {
      console.info(`stdout: ${data}`);
    });

    ff.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    ff.on("close", (code) => {
      console.info(`ffmpeg process exited with code ${code}`);
      if (code === 0) {
        resolve(true);
      } else {
        reject(code);
      }
    });
  });
}
