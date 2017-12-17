const path = require('path');

const resolve = relativePath => path.resolve(__dirname, '..', relativePath);

module.exports = {
  build: resolve('./dist/umd'),
  cache: resolve('./node_modules/.cache'),
  modules: resolve('./node_modules'),
  spec: resolve('./spec'),
  src: resolve('./src'),
  stories: resolve('./stories'),
  tsconfig: resolve('./tsconfig.json'),
};
