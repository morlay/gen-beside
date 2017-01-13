import * as axios from "axios";
import * as vfs from "vinyl-fs";
import * as File from "vinyl";
import * as _ from "lodash";
import * as del from "del";
import * as glob from "glob";
import * as path from "path";
import * as through2 from "through2";
import * as chalk from "chalk";

import {
  Transform,
  Stream,
} from "stream";

export interface BufferFile extends File {
  contents: Buffer;
  isStream(): this is never;
  isBuffer(): true;
  isNull(): this is never;
  isDirectory(): this is never;
  isSymbolic(): this is never;
}

export type IFetchConfig = string | Axios.AxiosXHRConfig<any>;

export const fromArray = (arr: any[]) => {
  const stream = new Stream();

  const len = arr.length;

  process.nextTick(() => {
    arr.forEach((item, idx) => {
      stream.emit("data", item);
      if (idx === len - 1) {
        stream.emit("end");
      }
    });
  });

  return stream;
};

export const request = (urls: IFetchConfig | IFetchConfig[]) => {
  const client = axios.create({});
  const opts = []
    .concat(urls)
    .map((urlOrOpt) => typeof urlOrOpt === "string" ? { url: urlOrOpt } : urlOrOpt);

  return fromArray(opts)
    .pipe(through2.obj((opt, encode, callback) => {
      client.request(opt)
        .then((res) => {
          callback(null, res.data);
        })
        .catch((error) => {
          callback(error);
        });
    }));
};

export const logger = (printer: (thunk: any) => string = (a) => a) =>
  through2.obj((data, enc, callback) => {
    console.log(printer(data));
    callback();
  });

export interface ICleanupOptions extends glob.IOptions {
  cwd?: string;
  force?: boolean;
  dryRun?: boolean;
}

export const cleanup = (opts?: ICleanupOptions) => {
  const dirname = opts.cwd;
  const basename = path.join(dirname, "..");

  return through2.obj(
    (thunk, encode, callback) => {
      callback(null, thunk);
    }, (callback) => {
      const filenames = del.sync([
        `${basename}/**`,
        `!${basename}`,
        `!${opts.cwd}{,.*,/**}`,
      ], opts);

      filenames.forEach((filename) => {
        console.log(chalk.red(`- ${filename}`));
      });

      callback();
    });
};

export const join = (process: (thunks: any[]) => any = (a) => a) => {
  const thunks: any[] = [];

  function transform(thunk: any, encode: string, callback: Function) {
    thunks.push(thunk);
    callback();
  }

  function flush(cb: Function) {
    Promise
      .resolve(process(thunks))
      .then((newThunks) => {
        const nextThunks = [].concat(newThunks);
        nextThunks.forEach((thunk) => {
          this.push(thunk);
        });
        cb();
      });
  }

  return through2.obj(transform, flush);
};

export const createFile = (path: string, contents: string) => new File({
  path,
  contents: new Buffer(contents),
}) as BufferFile;

export const createFiles = (files: { [path: string]: string }) => _.map(files, (contents, path) => createFile(path, contents));

export const genContext = {
  src: vfs.src,
  cleanup,
  request,
  logger,
  join,
  createFile,
  createFiles,
};

export type IGenContext = typeof genContext;

export const dest = vfs.dest;
