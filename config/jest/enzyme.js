const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
require('jest-enzyme');

Enzyme.configure({adapter: new Adapter()});
