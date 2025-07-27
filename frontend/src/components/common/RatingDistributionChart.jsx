import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useRef } from 'react'

export function RatingDistributionChart({ distribution }) {
  // Persistent dynamic color generation using refs
  const generatedColorsRef = useRef({})
  const hueIndexRef = useRef(0)
  const distinctHues = [0, 40, 80, 120, 160, 200, 240, 280, 320] // ~40° hue spread

  const getBarColor = (numeric, label) => {
    const numericColors = {
      1: '#fecaca',
      2: '#99f6e4',
      3: '#fbcfe8',
      4: '#fef3c7',
      5: '#bbf7d0',
      6: '#ddd6fe',
    }

    if (numeric !== null) {
      return numericColors[numeric] || '#e5e7eb'
    }

    const generatedColors = generatedColorsRef.current
    const hueIndex = hueIndexRef.current

    if (!generatedColors[label]) {
      const hue = distinctHues[hueIndex % distinctHues.length]
      const color = `hsl(${hue}, 70%, 75%)`
      generatedColors[label] = color
      hueIndexRef.current++
    }

    return generatedColors[label]
  }

  // Normalize and sort chart data
  const chartData = Object.entries(distribution || {})
    .map(([label, count]) => {
      // Check if the label is a simple number (not a range or descriptive text)
      const numeric = parseInt(label)
      const isNumeric = !isNaN(numeric) && label.trim() === numeric.toString()
      return {
        label,
        numeric: isNumeric ? numeric : null,
        count,
        percentage: 0,
      }
    })
    .sort((a, b) => {
      if (a.numeric !== null && b.numeric !== null) {
        return a.numeric - b.numeric
      } else if (a.numeric !== null) {
        return -1
      } else if (b.numeric !== null) {
        return 1
      } else {
        return a.label.localeCompare(b.label)
      }
    })

  // Compute totals and percentages
  const totalResponses = chartData.reduce((sum, item) => sum + item.count, 0)

  chartData.forEach((item) => {
    item.percentage =
      totalResponses > 0
        ? parseFloat(((item.count / totalResponses) * 100).toFixed(1))
        : 0
  })

  if (!distribution || Object.keys(distribution).length === 0) {
    return (
      <div className="no-distribution-data">
        <p>No distribution data available</p>
      </div>
    )
  }

  return (
    <div className="rating-distribution-chart">
      <div className="chart-header">
        <h4>Rating Distribution</h4>
        <p className="total-responses">Total: {totalResponses} responses</p>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(45 * chartData.length, 200)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {chartData.map((entry, index) => {
              const color = getBarColor(entry.numeric, entry.label)
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={color}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-legend">
        <div className="legend-items">
          {chartData.map((item) => (
            <div key={item.label} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: getBarColor(item.numeric, item.label) }}
              ></span>
              <span className="legend-label">
                {item.label}: {item.count} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
