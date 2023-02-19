export interface Job {
  id: string;
  bucketIn: string;
  fileIn: string;
  bucketOut: string;
  fileOut: string;
  model?: Model;
}

export type Model =
  | "GeneralGeneral"
  | "GeneralVoice"
  | "RecordingGeneral"
  | "RecordingVoice"
  | "RecordingSpeech";
