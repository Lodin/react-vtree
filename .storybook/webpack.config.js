/* eslint-disable sort-keys */

module.exports = ({config}) => {
  config.devtool = 'eval';

  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve('babel-loader'),
    options: {
      presets: [['babel-preset-react-app', {flow: false, typescript: true}]],
    },
  });

  config.resolve.extensions.push('.ts', '.tsx');

  return config;
};
