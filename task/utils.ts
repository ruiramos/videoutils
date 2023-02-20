import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { RedisClientType } from "redis";

import type { Job } from "videoutils-shared/types";

export async function addJobToQueue(client: RedisClientType, task: Job) {
  const strTask = JSON.stringify(task);
  console.log(`Adding task to queue: ${strTask}`);
  return client.lPush("vq", strTask);
}

export async function removeBgNoise(
  filename: string,
  output: string,
  model = "somnolent-hogwash-2018-09-01/sh.rnnn",
  setProgress: (n: number) => void
) {
  let duration: number;
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

    // ffmpeg logs to stderr for some reason
    ff.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
      const strData = data.toString();
      let match;
      if ((match = matchDuration(strData))) {
        duration = parseTimeToSeconds(match[1]);
      } else if ((match = matchTimeOutput(strData))) {
        let time = parseTimeToSeconds(match[1]);
        if (time && duration) setProgress(Math.round((time / duration) * 100));
      }
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

// returns the video duration in seconds from the time string captured from ffmpeg's output (eg "00:00:34.55")
export function parseTimeToSeconds(duration: string) {
  const [hour, minute, seconds] = duration.split(":").map((d) => parseFloat(d));
  return hour * 3600 + minute * 60 + seconds;
}

export function matchDuration(output: string) {
  return output.match(/Duration: ([^,]*), start/);
}

export function matchTimeOutput(output: string) {
  return output.match(/time=([^\s]+)\sbitrate/);
}
