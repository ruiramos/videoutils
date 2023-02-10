/**
  This thing will have to:

  1. receive the uploaded file

  2. do some checks

  3. upload to minio

  4. add job to queue

  return some id that allows the user to download the file?
**/

import type { NextApiRequest, NextApiResponse } from "next";
import busboy from "busboy";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  res.status(200).send("John Doe");
}
