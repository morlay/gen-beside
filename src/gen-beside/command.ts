import {
  run,
} from "./Gen";

import * as yargs from "yargs";

const argv = yargs(process.argv.slice(2))
  .usage("Usage: $0 <rootDir> [options]")
  .example("gen-beside src")
  .options({
    require: {
      type: "string",
      alias: "r",
    },
    generatorBaseDir: {
      type: "string",
      default: "__generators__",
    },
  })
  .help("help").alias("help", "h")
  .showHelpOnFail(false, "whoops, something went wrong! run with --help")
  .argv;

run({
  baseUrl: argv._[0],
  require: argv.require,
  generatorBaseDir: argv.generatorBaseDir,
});
