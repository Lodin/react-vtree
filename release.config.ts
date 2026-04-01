import type { GlobalConfig } from 'semantic-release';

const config: GlobalConfig = {
  branches: ['main'],
  repositoryUrl: 'https://github.com/Lodin/react-vtree',
  tagFormat: 'v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    ['@semantic-release/npm', { pkgRoot: '.' }],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]',
      },
    ],
    '@semantic-release/github',
  ],
};

export default config;
