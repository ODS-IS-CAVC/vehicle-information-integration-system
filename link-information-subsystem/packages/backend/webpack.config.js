const lazyImports = ["@nestjs/microservices/microservices-module", "@nestjs/websockets/socket-module", "class-transformer/storage"];

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ["./src/serverless.ts"],
    externals: [],
    output: {
      ...options.output,
      libraryTarget: "commonjs2",
    },
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          return lazyImports.includes(resource);
        },
      }),
    ],
  };
};
