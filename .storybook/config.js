const {addParameters, configure} = require('@storybook/react');

addParameters({
  options: {
    addonPanelInRight: true,
    name: 'React Virtualized Tree',
    selectedPanel: 'knobs',
  },
});

configure(() => require('../__stories__'), module);
