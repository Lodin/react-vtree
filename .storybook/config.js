import { configure, setAddon } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';
import JSXAddon from 'storybook-addon-jsx';

function loadStories() {
  require('../src/core/theme.css');

  const context = require.context("../src", true, /\.story\.tsx$/);
  for (const key of context.keys()) {
    context(key);
  }
}

setOptions({
  downPanelInRight: true,
  name: 'UI Kit',
});

setAddon(JSXAddon);

configure(loadStories, module);
