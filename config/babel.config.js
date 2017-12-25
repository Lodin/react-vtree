const {BUILD_TYPE} = process.env;
const isCjs = BUILD_TYPE === 'cjs';

module.exports = {
  presets: [
    [require('@babel/preset-env'), {
      targets: {
        browsers: BUILD_TYPE === 'cjs' ? [
          'last 2 versions',
          'IE 11',
        ] : [
          'last 2 Chrome versions',
        ],
      },
      loose: true,
      modules: false,
      shippedProposals: true,
      useBuiltIns: 'entry',
      include: ['proposal-object-rest-spread'],
    }],
    require('@babel/preset-react'),
    require('@babel/preset-typescript'),
  ],
  plugins: [
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
