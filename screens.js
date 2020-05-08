const screens = {}
function parse(line1, line2) {
  return Object.values(screens).map(scr => scr.parse(line1, line2)).find(x => x)
}
function screen(name, line1, line2 = /.*/, toObject = () => ({})) {
  const scr = { name, line1, line2, toObject }
  scr.parse = (line1, line2) => {
    const rone = scr.line1.exec(line1.trim())
    const rtwo = scr.line2.exec(line2.trim())
    if (rone && rtwo) return {
      name,
      ...toObject(rone.slice(1), rtwo.slice(1))
    }
    return null
  }
  scr.index = 0
  scr.screen = function(...args) {
    return Object.assign(
      screen(...args),
      {
        parent: scr,
        screen: scr.screen,
        index: this.index + 1
      }
    )
  }
  screens[name] = scr
  return scr
}

screen(
  'default-menu',
  /^Default$/,
  /^Menu$/
)
.screen(
  'date',
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/,
  /^(\d+):(\d+)(A|P)$/,
  ([dayOfWeek], [hours, minutes, ampm]) => ({time: {dayOfWeek, hours, minutes, ampm}})
)
.screen(
  'air-temperature',
  /^Air Temp\s*(\d+)°(F|C)$/,
  /.*/,
  ([temperature, unit], []) => ({air: {currentTemperature: +temperature, unit}}),
)
.screen(
  'water-temperature',
  /^(Pool|Spa) Temp\s+(\d+)°(F|C)$/,
  /.*/,
  ([which, temperature, unit], []) => ({[which.toLowerCase()]: {currentTemperature: +temperature, unit}})
)
.screen(
  'salt',
  /^Salt Level$/,
  /^(\d+) PPM$/,
  ([], [saltPpm]) => ({saltPpm: +saltPpm})
)
.screen(
  'heater',
  /^Heater(\d+)$/,
  /^(Auto Control)$/,
)
.screen(
  'filter-speed',
  /^Filter Speed$/,
  /^(.*)$/,
  ([], (filterSpeed) => ({filterSpeed}))
)

screen(
  'settings-menu',
  /^Settings$/,
  /^Menu$/
)
.screen(
  'spa-heater',
  /^Spa Heater(\d+)$/,
  /^(Off)|(?:(\d+)°(F|C))$/,
  ([], [off, temperature, unit]) => ({spa: {targetTemperature: off ? 0 : +temperature, unit}})
)
.screen(
  'pool-heater',
  /^Pool Heater(\d+)$/,
  /^(Off)|(?:(\d+)°(F|C))$/,
  ([], [off, temperature, unit]) => ({pool: {targetTemperature: off ? 0 : +temperature, unit}})
)
.screen(
  'vsp-speed-settings',
  /^VSP Speed Settings$/
)
.screen(
  'super-chlorinate',
  /^Super Chlorinate$/,
  /^Off$/
)
.screen(
  'spa-chlorinator',
  /^Spa Chlorinator$/
)
.screen(
  'pool-chlorinator',
  /^Pool Chlorinator$/
)
.screen(
  'set-date',
  /^Set Day and Time$/
)
.screen(
  'display-light',
  /^Display Light$/
)
.screen(
  'beeper',
  /^Beeper$/
)
.screen(
  'teach-wireless',
  /^Teach Wireless$/
)
.screen(
  'wireless',
  /^Wireless$/
)

const couple = (left, right) => {
  screens[left].right = right
  screens[right].left = left
}

couple('filter-speed', 'date')
couple('wireless', 'settings-menu')

module.exports = {parse, screens}