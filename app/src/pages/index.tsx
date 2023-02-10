import Head from "next/head";
import React, { useRef, FormEvent } from "react";

export default function Home() {
  const inputRef = useRef();

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(inputRef.current!.files);
  };

  return (
    <>
      <Head>
        <title>Video thing</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <p>this is the video thing</p>

        <form onSubmit={handleFormSubmit}>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4, video/quicktime"
          />
          <button type="submit">Upload</button>
        </form>
      </main>
    </>
  );
}
