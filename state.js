const axios = require('axios')
const config = require('./config')
const { decodeRawLeds } = require('./leds')
const { getKeys, layout, refresh } = require('./keys')
const { parse } = require('./screens')
const chalk = require('chalk')
const cheerio = require('cheerio')
const deepMerge = require('deepmerge')
const fs = require('fs')

let dataJson = ''
let data = {}
try {
  dataJson = fs.readFileSync('./data.json', 'utf-8')
  data = JSON.parse(dataJson)
} catch (e) { }

const decodeHtml = text => {
  const $ = cheerio.load(`<div>${text}</div>`)
  return $('div').text()
}

async function getState() {
  const url = new URL('/WNewSt.htm', config.url).toString()
  const response = await axios.post(url, {data: 'Update Local Server&'})

  const html = response.data.split('&nbsp;').join(' ')
  const startBody = html.indexOf("<body>") + 6
  endBody = html.indexOf("</body>")
  const body = html.slice(startBody, endBody);
  // console.warn(body); 
  
  //
  // Separate the body into Line One, Line Two, and the raw 
  // set of characters which encode the LED states. 
  // 
  const startLine1 = 2; 
  const endLine1 = body.indexOf("xxx")
  const line1 = decodeHtml(body.slice(startLine1, endLine1))
  
  const startLine2 = endLine1 + 5
  const endLine2 = body.indexOf("xxx", startLine2)
  const line2 = decodeHtml(body.slice(startLine2, endLine2))
  

  //
  // Evaluate the display strings against the configuration locked strings. 
  // If the strings match, set the variable that is used to signal that the
  // server should accept the unlock input. 
  // 
  // if((lineOne == MenuConfigLocked[0]) && (lineTwo == MenuConfigLocked[1]))
  // {
  //   IsConfigUnlocked = true; 
  // }
  // else 
  // {
  //   IsConfigUnlocked = false; 
  // }
  const startLine3 = endLine2 + 5
  const endLine3 = body.indexOf('xxx', startLine3)
  const rawLeds = body.slice(startLine3, endLine3 === -1 ? html.length : endLine3)
  const ledStatus = decodeRawLeds(rawLeds)
  if (ledStatus.updateNames) refresh()
  const rawKeys = await getKeys()

  const keys = rawKeys.map((key, i) => {
    const led = ledStatus.leds[i]
    return {
      ...key,
      led: rawLeds[i],
      chalk:
        led === false ? chalk.bgBlack
        : led === true ? chalk.bgGreen
        : led === 2 ? chalk.bgGreen.red
        : chalk.bgBlack
    }
  }).filter(key => key.name)

  const keyMap = Object.fromEntries(keys.map(key => [key.id, key]))
  const keyWidth = 12
  const screenWidth = keyWidth * 4 + 3

  const outputLine1 = center(line1, screenWidth)
  let outputLine2 = center(line2, screenWidth, ' ')
  if (ledStatus.checkSystem) {
    outputLine2 = chalk.yellow('Check System') + outputLine2.substr(12)
  }
  const output = outputLine1 + '\n' + outputLine2 + '\n' +
    layout.map(
      ids => ids.map(
        id => {
          const key = keyMap[id]
          if (key) {
            const label = center(key.name, keyWidth, ' ')
            return key.chalk(label)
          } else {
            return chalk.bgBlack(''.padEnd(keyWidth))
          }
        }
      ).join(' ')
    ).join('\n')
  
  const screen = parse(line1, line2)
  if (screen) {
    data = deepMerge(data, screen)
    delete data.name
    const newJson = JSON.stringify(data, null, 2)
    if (newJson !== dataJson) {
      fs.writeFile('./data.json', newJson, () => {})
      dataJson = newJson
    }
  }
  return {
    line1,
    line2,
    checkSystem: ledStatus.checkSystem,
    keys,
    screen,
    output,
    data
  }

}

function center (text, width, space = ' ') {
  return (''.padEnd(Math.floor((width - text.length) / 2), space) + text).padEnd(width, space)  
}


module.exports = { getState }