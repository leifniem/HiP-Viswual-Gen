import { SVG, on as SVGOn, Svg } from "@svgdotjs/svg.js"
import { colord } from "colord"
import { Pane } from 'tweakpane';
import RandomGen from "random-seed"

interface Config {
  canvas?: Svg;
  seed?: string;
  width: number;
  height: number;
  circleSize: number;
  padding: number;
  stepSize: number;
  lineChance: number;
  colorsPerLine: number;
  limitLinesToGrid?: boolean;
  lineOverlap?: boolean;
  coloredDots?: boolean;
  maxLineLength?: number;
  whiteBackground?: boolean;
  overrideXCount?: number;
  overrideYCount?: number;
}

let config: Config = {
  seed: "",
  width: 800,
  height: 800,
  padding: 100,
  circleSize: 10,
  stepSize: 50,
  lineChance: .2,
  whiteBackground: false,
  limitLinesToGrid: true,
  colorsPerLine: 3,
  coloredDots: true,
  overrideXCount: 0,
  overrideYCount: 0,
  // animate: false
}

const configLimits = {

}

const colors = [
  "#FED61E",
  "#44B4E9",
  "#008317",
  "#002E5C",
  "#003A3E",
  "#6C2400",
  "#FF9900",
]

// const gradient = [
//   ["#44B4E9", 5],
//   ["#002E5C", 22],
//   ["#003A3E", 25],
//   ["#008317", 45],
//   ["#FED61E", 66],
//   ["#FF9900", 77],
//   ["#6C2400", 95]
// ]

// calculate absolute pposition with padding
function calcPosition({ x, y, padding, numElements, reducedDims, subtractHalfCircle = true }) {
  const pos = {
    posX: x / numElements.x * reducedDims.width + padding,
    posY: y / numElements.y * reducedDims.height + padding
  }
  if (subtractHalfCircle) {
    for (const key in pos) {
      pos[key] -= reducedDims.halfCircle
    }
  }
  return pos
}

function drawElement({ x, y, canvas, occupationMap, random, lineChance, lineLengthLimit, numElements, padding, circleSize, limitLinesToGrid, lineOverlap, colorsPerLine, coloredDots, reducedDims }: Config &{ x: number, y: number, occupationMap: number[][], random: RandomGen, lineLengthLimit: number, numElements: {x: number, y: number}, reducedDims: {width:number, height: number, halfCircle: number} }) {

  if (occupationMap[x].includes(y) || !canvas) return
  if (random.random() < lineChance! && x != numElements.x - 1 && y != 0) {
    // Line
    let length = random.intBetween(2, lineLengthLimit);
    const { posX, posY } = calcPosition({ x, y, subtractHalfCircle: false, padding, numElements, reducedDims})

    if (limitLinesToGrid) {
      const overshootX = x + length - numElements.x;
      const overshootY = (y - length) * -1;
      const overshoot = Math.max(overshootX, overshootY)
      if (overshoot > 0) length -= overshoot
    }

    const { posX: endX, posY: endY } = calcPosition({
      x: x + length,
      y: y - length,
      subtractHalfCircle: false,
      padding,
      numElements,
      reducedDims
    })

    const gradient = canvas!.gradient("linear", (add) => {
      for (let i = 0; i < colorsPerLine; i++) {
        add.stop({ offset: i / (colorsPerLine - 1), color: colors[random(colors.length)] })
      }
    }).transform({
      rotate: -45,
      origin: {x: .5, y: .5}
    })
    canvas.line(posX, posY, endX, endY).stroke({
      width: circleSize,
      linecap: "round"
    }).attr({ "stroke": gradient })

    if (!lineOverlap) {
      for (let i = 0; i <= length; i++) {
        if (x + i <= numElements.x) occupationMap[x + i].push(y - i)
      }
    }
  } else {
    // Circle
    const { posX, posY } = calcPosition({ x, y, padding, numElements, reducedDims })
    canvas
      .circle(circleSize)
      .fill(coloredDots ? colors[random(colors.length)] : "#333")
      .move(posX, posY)
    occupationMap[x].push(y)
  }
}

function render(configParams: Config) {
  config.canvas?.remove()

  if (config.seed === "") config.seed = RandomGen.create().string(16)

  const { seed, width, height, padding, circleSize, stepSize, overrideXCount, overrideYCount, maxLineLength, whiteBackground } = configParams

  const random = RandomGen.create(seed)

  const reducedDims = {
    width: width - 2 * padding,
    height: height - 2 * padding,
    halfCircle: circleSize / 2
  }

  const numElements = {
    x: overrideXCount && overrideXCount > 0 ? overrideXCount : reducedDims.width / stepSize,
    y: overrideYCount && overrideYCount > 0 ? overrideYCount : reducedDims.height / stepSize
  }

  const lineLengthLimit = maxLineLength ?? Math.floor(Math.min(numElements.x, numElements.y)) / 2;

  config.canvas = SVG().viewbox(0, 0, width, height).size(width, height).addTo('body')

  config.canvas.rect(width, height).fill(whiteBackground ? "#ffffff" : "#000000")
  // Create 2D array of points in grid
  let occupationMap: number[][] = Array.from({ length: numElements.x + 1 }, x => [])


  for (let x = 0; x <= numElements.x; x++) {
    for (let y = 0; y <= numElements.y; y++) {
      drawElement({ x, y, occupationMap, random, numElements, lineLengthLimit, reducedDims, ...config })
    }
  }
}

SVGOn(document, "DOMContentLoaded", function () {
  render(config)
})

const pane = new Pane()

for (const key in config) {
  const input = pane.addInput(config, key as keyof Config)
  input.on('change', () => {
    render(config)
  })
}

const regenButton = pane.addButton({ title: "Regenerate" })
regenButton.on("click", () => {
  render(config)
})

const exportButton = pane.addButton({ title: "Export Settings" })
exportButton.on('click', () => {
  const settings = pane.exportPreset()
  const settingsString = JSON.stringify(settings, null, 2)
  const blob = new Blob([settingsString], { type: "application/json" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = "GraphicsGenConfig.json"
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 0)
})

const saveButton = pane.addButton({ title: "Save SVG" })
saveButton.on('click', () => {
  var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(config.canvas?.svg()!);
  const link = document.createElement("a")
  link.href = url
  link.download = `HiP-Visual-${config.seed}.svg`
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 0)
})