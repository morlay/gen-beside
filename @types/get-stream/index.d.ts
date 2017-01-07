declare module "get-stream" {
  const getStream: (stream: NodeJS.ReadWriteStream) => Promise<any>;
  export = getStream;
}
