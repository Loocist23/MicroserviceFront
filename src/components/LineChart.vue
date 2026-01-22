<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  series: {
    type: Array,
    required: true,
  },
  unit: {
    type: String,
    default: '',
  },
  height: {
    type: Number,
    default: 180,
  },
})

const containerRef = ref(null)
const canvasRef = ref(null)
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  label: '',
  value: 0,
})
const chartState = reactive({
  width: 0,
  height: 0,
  points: [],
  minValue: 0,
  maxValue: 0,
})
let resizeObserver

const drawChart = () => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const width = container.clientWidth || 320
  const height = props.height
  const ratio = window.devicePixelRatio || 1

  canvas.width = width * ratio
  canvas.height = height * ratio
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  ctx.scale(ratio, ratio)
  ctx.clearRect(0, 0, width, height)

  const values = props.series.map((point) => point.value)
  const maxValue = Math.max(...values, 1)
  const minValue = Math.min(...values, 0)
  const padding = { top: 20, right: 16, bottom: 30, left: 48 }
  const innerWidth = Math.max(10, width - padding.left - padding.right)
  const innerHeight = Math.max(10, height - padding.top - padding.bottom)
  const horizontalStep =
    props.series.length > 1 ? innerWidth / (props.series.length - 1) : innerWidth / 2

  const normalize = (value) => {
    if (maxValue === minValue) return height / 2
    return padding.top + innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight
  }

  const xPosition = (index) => {
    if (props.series.length <= 1) {
      return padding.left + innerWidth / 2
    }
    return padding.left + index * horizontalStep
  }

  chartState.width = width
  chartState.height = height
  chartState.minValue = minValue
  chartState.maxValue = maxValue
  chartState.points = props.series.map((point, index) => ({
    x: xPosition(index),
    y: normalize(point.value),
    label: point.label,
    value: point.value,
  }))

  // Axes
  ctx.strokeStyle = '#cbd5f5'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, padding.top + innerHeight)
  ctx.lineTo(padding.left + innerWidth, padding.top + innerHeight)
  ctx.stroke()

  // Grid + y-axis labels
  const gridLines = 4
  ctx.fillStyle = '#94a3b8'
  ctx.font = '12px Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= gridLines; i += 1) {
    const value = minValue + ((maxValue - minValue) * (gridLines - i)) / gridLines
    const y = padding.top + (innerHeight * i) / gridLines
    ctx.strokeStyle = 'rgba(148,163,184,0.4)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + innerWidth, y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillText(`${Math.round(value * 100) / 100}${props.unit ? ` ${props.unit}` : ''}`, padding.left - 8, y)
  }

  // X-axis labels
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  props.series.forEach((point, index) => {
    const x = xPosition(index)
    ctx.fillText(point.label, x, padding.top + innerHeight + 6)
  })

  // Area gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.35)')
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0)')

  ctx.beginPath()
  props.series.forEach((point, index) => {
    const x = xPosition(index)
    const y = normalize(point.value)
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.lineTo(padding.left + innerWidth, padding.top + innerHeight)
  ctx.lineTo(padding.left, padding.top + innerHeight)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  // Line
  ctx.beginPath()
  props.series.forEach((point, index) => {
    const x = xPosition(index)
    const y = normalize(point.value)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = '#4f46e5'
  ctx.lineWidth = 2
  ctx.stroke()

  // Points
  ctx.fillStyle = '#4f46e5'
  props.series.forEach((point, index) => {
    const x = xPosition(index)
    const y = normalize(point.value)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  })
}

const handleResize = () => {
  window.requestAnimationFrame(drawChart)
}

const onPointerMove = (event) => {
  if (!chartState.points.length) return
  const container = containerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  const x = event.clientX - rect.left
  let closest = chartState.points[0]
  let minDelta = Math.abs(x - closest.x)
  for (const point of chartState.points) {
    const delta = Math.abs(x - point.x)
    if (delta < minDelta) {
      minDelta = delta
      closest = point
    }
  }
  tooltip.visible = true
  tooltip.x = closest.x
  tooltip.y = closest.y
  tooltip.label = closest.label
  tooltip.value = closest.value
}

const onPointerLeave = () => {
  tooltip.visible = false
}

onMounted(() => {
  resizeObserver = new ResizeObserver(handleResize)
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  drawChart()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => props.series,
  () => {
    tooltip.visible = false
    drawChart()
  },
  { deep: true },
)
</script>

<template>
  <div ref="containerRef" class="line-chart">
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      @mousemove="onPointerMove"
      @mouseleave="onPointerLeave"
    ></canvas>
    <div
      v-if="tooltip.visible"
      class="line-chart__tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <p>{{ tooltip.label }}</p>
      <strong>{{ tooltip.value }} {{ props.unit }}</strong>
    </div>
  </div>
</template>

<style scoped>
.line-chart {
  width: 100%;
  position: relative;
}

.line-chart canvas {
  display: block;
}

.line-chart__tooltip {
  position: absolute;
  transform: translate(-50%, -110%);
  background: #0f172a;
  color: #fff;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  pointer-events: none;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.25);
  min-width: 120px;
  text-align: center;
}

.line-chart__tooltip p {
  margin: 0;
  opacity: 0.8;
}

.line-chart__tooltip strong {
  display: block;
  margin-top: 0.1rem;
  font-size: 1rem;
}
</style>
