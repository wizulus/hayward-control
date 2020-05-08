const {
  sleep,
  pause,
  setHeater,
  learn,
  goToScreen,
  getButtons,
  pressButton
} = require('./control')
const config = require('config')
const {screens} = require('./screens')
const {
  getKeys,
  refresh,
  layout
} = require('./keys')
const { getState } = require('./state')

module.exports = {
  sleep,
  pause,
  setHeater,
  learn,
  goToScreen,
  getButtons,
  pressButton,
  config,
  screens,
  getKeys,
  refresh,
  layout,
  getState
}