export interface Job {
  id: string;
  bucketIn: string;
  fileIn: string;
  bucketOut: string;
  fileOut: string;
  model?: Model;
  type: JobType;
  dryRun?: boolean;
}

export type Model =
  | "GeneralGeneral"
  | "GeneralVoice"
  | "RecordingGeneral"
  | "RecordingVoice"
  | "RecordingSpeech";

type JobType = "NoiseReduction";

export type JobStatus =
  | "uploading"
  | "uploaded"
  | "processing"
  | "done"
  | "error";
