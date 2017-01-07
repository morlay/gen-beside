import { task } from "gen-beside";

task("copy", (ctx) =>
  ctx.src("files/*", { cwd: __dirname })
    .pipe(ctx.cleanup({ cwd: __dirname })),
);

task("copy2", (ctx) =>
  ctx.src("files2/*.json", { cwd: __dirname }),
);
