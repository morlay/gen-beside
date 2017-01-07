import * as _ from "lodash";
import * as glob from "glob";
import * as path from "path";
import * as proxyquire from "proxyquire";
import * as chalk from "chalk";
import * as File from "vinyl";

import {
  IGenContext,
  genContext,
  dest,
} from "./GenContext";

import through2 = require("through2");

export type IGeneratorFn =  (ctx: IGenContext) => NodeJS.ReadWriteStream;

enum IGeneratorFlag {
  normal,
  only,
  skip,
}

class Generator {
  constructor(protected generator: IGeneratorFn,
              protected dirname: string,
              protected desc: string,
              public flag: IGeneratorFlag) {

  }

  start() {
    const base = path.join(this.dirname, "..");

    return this.generator(genContext)
      .once("data", () => {
        console.log(`Task ${chalk.cyan(this.desc)}:`);
      })
      .on("data", (file: File) => {
        console.log(
          chalk.green(`+ ${path.resolve(base, file.basename)}`),
        );
      })
      .pipe(dest(".", { cwd: base }));
  }
}

class Gen {
  static initialGen = () => new Gen();

  generators: Generator[] = [];

  list() {
    const onlys = _.filter(this.generators, (generator) => generator.flag === IGeneratorFlag.only);

    if (!_.isEmpty(onlys)) {
      return onlys;
    }

    return _.filter(this.generators, (generator) => generator.flag !== IGeneratorFlag.skip);
  }

  task(generator: IGeneratorFn, dirname: string, desc: string, flag: IGeneratorFlag = IGeneratorFlag.normal) {
    this.generators = this.generators.concat(
      new Generator(generator, dirname, desc, flag),
    );
  }
}

export interface IGenOptions {
  require?: string;
  baseUrl: string;
  generatorBaseDir: string;
}

const createTaskInjector = (gen: Gen, dirname: string) => {
  const basicTask = (desc: string, generator: IGeneratorFn) => gen.task(generator, dirname, desc);

  const subTasks = {
    only: (desc: string, generator: IGeneratorFn) => gen.task(generator, dirname, desc, IGeneratorFlag.only),
    skip: (desc: string, generator: IGeneratorFn) => gen.task(generator, dirname, desc, IGeneratorFlag.skip),
  };

  return _.assign(basicTask, subTasks);
};

export const run = (opts: IGenOptions) => {
  if (opts.require) {
    require(opts.require);
  }

  const cwd = `${process.cwd()}${opts.baseUrl ? `/${opts.baseUrl}` : ""}`;

  const dirs = glob.sync(`**/${opts.generatorBaseDir}`, { cwd });

  const gen = Gen.initialGen();

  dirs.forEach((dirname) => {
    const finalDirname = `${cwd}/${dirname}`;
    proxyquire
      .noCallThru()
      .load(finalDirname, {
        "gen-beside": {
          task: createTaskInjector(gen, finalDirname),
        },
      });
  });

  gen.list()
    .forEach((generator) => generator.start());
};
