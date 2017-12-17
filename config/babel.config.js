const {NODE_ENV} = process.env;

module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: NODE_ENV === 'production' ? [
          'last 2 versions',
          'IE 11',
        ] : [
          'last 2 Chrome versions',
        ],
      },
    }],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      polyfill: false,
    }],
    '@babel/plugin-external-helpers',
  ],
};
