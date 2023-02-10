import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

export async function addTestJobToQueue(client, argTask = {}) {
  const task = {
    filename: "test.mp4",
    ...argTask,
  };

  const strTask = JSON.stringify(task);

  console.log(`Adding task to queue: ${strTask}`);

  return client.lPush("vq", strTask);
}

export async function processFile(
  filename,
  model = "somnolent-hogwash-2018-09-01/sh.rnnn"
) {
  return new Promise((resolve, reject) => {
    try {
      rmSync("./processed.mp4");
    } catch {}
    const ff = spawn("ffmpeg", [
      "-i",
      filename,
      "-af",
      `arnndn=m='models/${model}'`,
      "processed.mp4",
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
        resolve();
      } else {
        reject(code);
      }
    });
  });
}
