/* eslint-disable no-param-reassign */

const path = require('path');
const kebabCase = require('kebab-case');

const localPattern = /\[local\]/gi;
const namePattern = /\[name\]/gi;

module.exports = {
  getLocalIdent: (context, localIdentName, localName, options) => {
    if (!options.context) {
      options.context = context.options && typeof context.options.context === 'string'
        ? context.options.context
        : context.context;
    }

    localIdentName = localIdentName.replace(localPattern, localName);
    const name = kebabCase(path.basename(context.resourcePath).split('.')[0]).substr(1);
    return localIdentName.replace(namePattern, name);
  },
};
