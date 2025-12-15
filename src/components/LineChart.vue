<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

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
  const horizontalStep = props.series.length > 1 ? width / (props.series.length - 1) : width

  const normalize = (value) => {
    if (maxValue === minValue) return height / 2
    return height - ((value - minValue) / (maxValue - minValue)) * height
  }

  // Grid
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Area gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.35)')
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0)')

  ctx.beginPath()
  props.series.forEach((point, index) => {
    const x = index * horizontalStep
    const y = normalize(point.value)
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  // Line
  ctx.beginPath()
  props.series.forEach((point, index) => {
    const x = index * horizontalStep
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
    const x = index * horizontalStep
    const y = normalize(point.value)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  })
}

const handleResize = () => {
  window.requestAnimationFrame(drawChart)
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
  () => drawChart(),
  { deep: true },
)
</script>

<template>
  <div ref="containerRef" class="line-chart">
    <canvas ref="canvasRef" aria-hidden="true"></canvas>
  </div>
</template>
