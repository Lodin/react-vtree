const {BUILD_TYPE} = process.env;
const isCjs = BUILD_TYPE === 'cjs';

module.exports = {
  presets: [
    [require('@babel/preset-env'), {
      targets: {
        browsers: [
          'last 2 versions',
          'IE 11',
        ],
      },
      loose: true,
      modules: isCjs ? 'commonjs' : false,
      shippedProposals: true,
      useBuiltIns: 'entry',
      include: ['proposal-object-rest-spread'],
    }],
    require('@babel/preset-react'),
    require('@babel/preset-typescript'),
  ],
  plugins: [
    require('babel-plugin-remove-dts-export'),
    [require('@babel/plugin-transform-runtime'), {
      polyfill: false,
    }],
    require('@babel/plugin-external-helpers'),
    [require('@babel/plugin-proposal-class-properties'), {loose: true}],
    [require('babel-plugin-reimport'), {
      'react-virtualized': {
        transform(token, library) {
          switch (token) {
            case 'Grid':
            case 'accessibilityOverscanIndicesGetter':
              return {
                default: false,
                module: `${library}/dist/${isCjs ? 'commonjs' : 'es'}/Grid`,
              };
            default:
              return library;
          }
        },
      },
    }],
  ],
};
