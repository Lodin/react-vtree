import {configure} from '@storybook/react';
import {setOptions} from '@storybook/addon-options';

function loadStories() {
  require('../src/Tree.story');
}

setOptions({
  downPanelInRight: true,
  name: 'React Virtualized Tree',
});

configure(loadStories, module);
