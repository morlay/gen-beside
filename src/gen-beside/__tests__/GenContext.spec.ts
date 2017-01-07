import {
  test,
  AssertContext,
} from "ava";

import * as vfs from "vinyl-fs";
import * as getStream from "get-stream";

import {
  request,
  logger,
  join,
  createFile,
} from "../GenContext";

const handleStream = (t: AssertContext, input: (t: AssertContext) => NodeJS.ReadWriteStream) => getStream(input(t));

test("#request", handleStream, () => {
  return request([
    "http://baidu.com",
    "http://baidu.com",
  ])
    .pipe(logger());
});

test("#src", handleStream, () => {
  return vfs.src("src/**")
    .pipe(logger((file) => file.path));
});

test("#join", handleStream, () => {
  return vfs.src("src/**/*.ts")
    .pipe(join((files) => {
      const contents = files.map((file) => `export * from "${file.path}";\n`).join("");
      return createFile("index.ts", contents);
    }))
    .pipe(logger((file) => String(file.contents)));
});
