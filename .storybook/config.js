const {configure} = require('@storybook/react');
const {setOptions} = require('@storybook/addon-options');

const loadStories = () => {
  require('../__stories__');
};

setOptions({
  downPanelInRight: true,
  name: 'React Virtualized Tree',
  selectedAddonPanel: 'knobs',
});

configure(loadStories, module);
