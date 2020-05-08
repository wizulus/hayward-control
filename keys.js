const {JSDOM} = require('jsdom')
const config = require('./config')
const axios = require('axios')

const layout = [
  ['Key_00', 'Key_06', 'Key_12', 'Key_18'],
  ['Key_01', 'Key_07', 'Key_13', 'Key_19'],
  ['Key_02', 'Key_08', 'Key_14', 'Key_20'],
  ['Key_03', 'Key_09', 'Key_15', 'Key_21'],
  ['Key_04', 'Key_10', 'Key_16', 'Key_22'],
  ['Key_05', 'Key_11', 'Key_17', 'Key_23']
]

const ids = Array(24).fill().map((x, i) => `Key_${i.toString().padStart(2, 0)}`)

let _keys

const getKeys = () => _keys ? _keys : _keys = (async () => {
  const url = new URL('/', config.url).toString()
  const response = await axios.get(url)
  const dom = new JSDOM(response.data.split('&nbsp;').join(' '))
  const ret = ids.map(id => {
    const element = dom.window.document.getElementById(id)
    const code = (/WebsProcessKey\("(..)"\)/.exec(element.getAttribute('onclick')) || [])[1] || null
    return {id, code, name: element && element.textContent.trim()}
  })
  dom.window.close()
  return ret
})()

async function refresh() {
  _keys = null
  return getKeys()
}

module.exports = {
  getKeys,
  refresh,
  layout
}