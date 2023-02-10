import { createClient } from "redis";
import { addTestJobToQueue, processFile } from "./utils.js";

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
    const jobData = JSON.parse(job);

    console.log(`Got new task: ${job}`);

    // download file
    // TODO noop
    console.log("get file from somewhere");

    // process file
    try {
      await processFile(jobData.filename, getModelPath(jobData.model));
    } catch (e) {
      console.error(e);
      continue;
    }

    // upload file
    // TODO noop
    console.log("upload file somewhere");
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
