import { parseTimeToSeconds, matchTimeOutput, matchDuration } from "./utils";

describe("utils", () => {
  it("parses durations correctly", () => {
    const strDuration = "01:23:27.53";
    const duration = parseTimeToSeconds(strDuration);

    expect(duration).toEqual(1 * 3600 + 23 * 60 + 27.53);
  });

  describe("testing ffmpeg output matchers", () => {
    it("parses the Duration line correctly", () => {
      const output = `Input #0, mov,mp4,m4a,3gp,3g2,mj2, from '/tmp/1676848007187-CleanShot 2023-01-05 at 10.41.13-processed.mp4':
  Metadata:
    major_brand     : isom
    minor_version   : 512
    compatible_brands: isomiso2avc1mp41
    encoder         : Lavf59.27.100
  Duration: 00:00:27.53, start: 0.000000, bitrate: 315 kb/s
`;

      expect(matchDuration(output)![1]).toEqual("00:00:27.53");
    });

    it("parses the frames lines correctly", () => {
      const output =
        "frame= 1153 fps= 87 q=31.0 size=     512kB time=00:00:18.13 bitrate= 231.3kbits/s speed=1.36x";
      expect(matchTimeOutput(output)![1]).toEqual("00:00:18.13");
    });
  });
});
