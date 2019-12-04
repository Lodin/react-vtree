const {BUILD_TYPE} = process.env;
const isCjs = BUILD_TYPE === 'cjs';
const isLib = BUILD_TYPE === 'lib';

module.exports = api => ({
  plugins: [
    [require('@babel/plugin-proposal-class-properties'), {loose: true}],
    [require('@babel/plugin-proposal-optional-chaining'), {loose: true}],
    ...(isLib
      ? []
      : [
          [
            require('babel-plugin-transform-async-to-promises'),
            {hoist: true, inlineHelpers: true},
          ],
          [
            require('@babel/plugin-transform-runtime'),
            {
              regenerator: false,
            },
          ],
          [require('@babel/plugin-proposal-object-rest-spread'), {loose: true}],
        ]),
  ],
  presets: [
    require('@babel/preset-typescript'),
    [require('@babel/preset-react'), {useBuiltIns: true}],
    ...(isLib
      ? []
      : [
          [
            require('@babel/preset-env'),
            {
              loose: true,
              modules: isCjs ? 'commonjs' : false,
              shippedProposals: true,
              targets: {
                browsers: ['last 2 versions', 'IE 11'],
              },
              useBuiltIns: false,
            },
          ],
        ]),
  ],
  ...(api.env('test') && {
    presets: [
      require('@babel/preset-typescript'),
      [require('@babel/preset-react'), {useBuiltIns: true}],
      [
        require('@babel/preset-env'),
        {
          modules: 'commonjs',
          targets: {
            node: process.versions.node,
          },
        },
      ],
    ],
  }),
});
