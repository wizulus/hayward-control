const axios = require('axios')
const config = require('./config')
const chalk = require('chalk')
const { getKeys } = require('./keys')
const { getState } = require('./state')
const { screens } = require('./screens')

async function pressButton(name) {
  const buttons = await getButtons()
  const button = buttons.find(x => x.name.toLowerCase() === name.toLowerCase())
  if (button) {
    const url = new URL('/WNewSt.htm', config.url).toString()
    const resp = await axios({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: `KeyId=${button.code}&`
    })
  } else {
    console.warn(chalk.yellow(`Could not find button '${name}'`))
  }
}

async function getButtons() {
  const keys = await getKeys()
  const buttons = [
    ...keys.filter(x => x.name).map(x => ({name: x.name, code: x.code})),
    {name: 'PLUS', code: '06'},
    {name: 'LEFT', code: '03'},
    {name: 'MENU', code: '02'},
    {name: 'RIGHT', code: '01'},
    {name: 'MINUS', code: '05'}
  ]
  return buttons
}

const pause = () => sleep(1000)

async function goToScreen(name) {
  const state = await getState()
  const currentScreen = state.screen && screens[state.screen.name]
  const targetScreen = screens[name]
  if (!targetScreen) throw new Error(`Screen ${name} not found.`)

  if (!currentScreen) {
    console.info(`We're on an unknown screen. Pressing menu.`)
    console.log(state.output)
    await pressButton('Menu')
    await pause()
    return await goToScreen(name)
  }

  if (currentScreen.parent && currentScreen.parent !== targetScreen.parent) {
    console.info(`We're deep in the wrong menu, ${currentScreen.parent.name}. We want ${targetScreen.parent.name}. Pressing menu.`)
    await pressButton('Menu')
    await pause()
    return await goToScreen(name)
  }

  if (!currentScreen.parent && currentScreen !== targetScreen.parent) {
    console.info(`We're on the wrong menu, ${currentScreen.name}. We want ${targetScreen.parent.name}. Pressing menu.`)
    await pressButton('Menu')
    await pause()
    return await goToScreen(name)
  }


  if (currentScreen.index < targetScreen.index) {
    console.info(`We're on ${currentScreen.name} and ${targetScreen.name} is to the right. Pressing right.`)
    await pressButton('Right')
    await pause()
    return await goToScreen(name)
  }

  if (currentScreen.index > targetScreen.index) {
    console.info(`We're on ${currentScreen.name} and ${targetScreen.name} is to the left. Pressing left.`)
    await pressButton('Left')
    await pause()
    return await goToScreen(name)
  }

  console.info(`We're on ${currentScreen.name}!`)
  return state
}

async function learn() {
  let state = await getState()
  if (!state.data.pool || !state.data.pool.targetTemperature)
    state = await goToScreen('pool-heater')
  if (!state.data.spa || !state.data.spa.targetTemperature)
    state = await goToScreen('spa-heater')
  return state
}

async function setHeater(which, temp) {
  if (temp < 65) temp = 0
  let state = await learn()
  let success = 5
  while (state.data[which].targetTemperature !== temp || success < 5) {
    state = await goToScreen(`${which}-heater`)
    if (state.data[which].targetTemperature > 100 && temp < 70) {
      success = 0
      console.info(`Temperature looped around to high. Pressing Plus.`)
      await pressButton('plus')
    } else if (state.data[which].targetTemperature < 70 && temp > 100) {
      success = 0
      console.info(`Temperature looped around to low. Pressing Minus.`)
      await pressButton('minus')
    } else if (state.data[which].targetTemperature < temp) {
      success = 0
      console.info(`Temperature is set too low. Pressing Plus.`)
      await pressButton('plus')
    } else if (state.data[which].targetTemperature > temp) {
      success = 0
      console.info(`Temperature is set too high. Pressing Minus.`)
      await pressButton('minus')
    } else {
      console.info('Hanging around in case I need to make corrections.')
      success++
    }
    await pause()
  }
  console.info('Done!')
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
  sleep,
  pause,
  setHeater,
  learn,
  goToScreen,
  getButtons,
  pressButton
}

