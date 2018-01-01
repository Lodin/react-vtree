/* eslint-disable import/no-unresolved */

const {configure} = require('@storybook/react');
const {setOptions} = require('@storybook/addon-options');

function loadStories() {
  require('../src/Tree.story');
}

setOptions({
  downPanelInRight: true,
  name: 'React Virtualized Tree',
});

configure(loadStories, module);
