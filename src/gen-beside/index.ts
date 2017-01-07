import * as _ from "lodash";

import {
  IGeneratorFn,
} from "./Gen";

const log = () => console.log("please use cli `gen-beside`");

function taskFactory(desc: string, generator: IGeneratorFn) {
  log();
}

const subs = {
  only: taskFactory,
  skip: taskFactory,
};

export const task = _.assign(taskFactory, subs);
