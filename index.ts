import { SVG, on as SVGOn, Svg } from "@svgdotjs/svg.js"
import { colord } from "colord"
import randomGen from "random-seed"

interface Config {
  seed?: string;
  dimensions: {
    width: number;
    height: number;
    circleSize: number;
    padding: number;
    stepSize: number;
  }
  lineChance?: number;
  maxLineLength?: number;
  whiteBackground?: boolean;
  overrideXCount?: number;
  overrideYCount?: number;
}

const config: Config = {
  // seed: "Hallo Tobi",
  dimensions: {
    width: 800,
    height: 800,
    padding: 100,
    circleSize: 10,
    stepSize: 50,
  },
  whiteBackground: false,
  // overrideXCount: 0,
  // overrideYCount: 0,
  // animate: false
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

const gradient = [
  ["#44B4E9", 5],
  ["#002E5C", 22],
  ["#003A3E", 25],
  ["#008317", 45],
  ["#FED61E", 66],
  ["#FF9900", 77],
  ["#6C2400", 95]
]


const { width, height, padding, circleSize, stepSize } = config.dimensions
const { seed, overrideXCount, overrideYCount } = config

const random = randomGen.create(seed)
const lineChance = config.lineChance ?? random(20, 50) / 100

const reducedDims = {
  width: width - 2 * padding,
  height: height - 2 * padding,
  halfCircle: circleSize / 2
}

const numElements = {
  x: overrideXCount ?? reducedDims.width / stepSize,
  y: overrideYCount ?? reducedDims.height / stepSize
}

const maxLineLength = config.maxLineLength ?? Math.floor(Math.min(numElements.x, numElements.y)) / 2;


// calculate absolute pposition with padding
function calcPosition({ x, y, subtractHalfCircle = true }) {
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

function drawElement({ x, y, canvas, occupationMap }: { x: number, y: number, canvas: Svg, occupationMap: Record<number, number[]> }) {
  const color1 = colord(colors[random(colors.length)])
  if (random.random() < lineChance && x != numElements.x - 1 && y != 0) {
    // Line
    let length = random.intBetween(2, maxLineLength);
    const direction = random() >= 0.5 ? 1 : -1 //true: to top right, false: to bottom left
    const overFlow = Math.max(x + length * direction, y - length * direction)
    const { posX, posY } = calcPosition({ x, y, subtractHalfCircle: false, })
    const { posX: endX, posY: endY } = calcPosition({
      x: x + length,
      y: y - length,
      subtractHalfCircle: false,
    })
    const gradient = canvas.gradient("linear", (add) => {
      const color3 = colord(colors[random(colors.length)])
      // const color2 = colord({ l: color1., c:, h })
      add.stop({ offset: 0, color: color1.toHex() })
      add.stop({ offset: 1, color: color3.toHex() })
    })
    canvas.line(posX, posY, endX, endY).stroke({
      width: circleSize,
      linecap: "round"
    }).attr({ "stroke": gradient })
  } else {
    // Circle
    const { posX, posY } = calcPosition({ x, y })
    canvas
      .circle(circleSize)
      .fill("#333")
      .move(posX, posY)
  }
}

SVGOn(document, "DOMContentLoaded", function () {
  const canvas = SVG().attr({ fill: config.whiteBackground ? "#fff" : "#000" }).viewbox(0, 0, width, height).size(width, height).addTo('body')



  // Create 2D array of points in grid
  let occupationMap: Record<number, number[]> = {}

  for (let y = 0; y <= numElements.y; y++) {
    for (let x = 0; x <= numElements.x; x++) {
      drawElement({ x, y, canvas, occupationMap })
    }
  }

})