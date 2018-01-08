const {configure} = require('@storybook/react');
const {setOptions} = require('@storybook/addon-options');

function loadStories() {
  // eslint-disable-next-line import/no-unresolved
  require('../__stories__/Tree');
}

setOptions({
  downPanelInRight: true,
  name: 'React Virtualized Tree',
  selectedAddonPanel: 'knobs',
});

configure(loadStories, module);
