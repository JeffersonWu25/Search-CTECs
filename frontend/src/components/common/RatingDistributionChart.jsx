import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts'
import { useRef } from 'react'
import { calculateAverageRating } from '../../utils/ratingCalculations'

export function RatingDistributionChart({ distribution }) {
  // Persistent dynamic color generation using refs
  const generatedColorsRef = useRef({})
  const hueIndexRef = useRef(0)
  const distinctHues = [0, 40, 80, 120, 160, 200, 240, 280, 320] // ~40° hue spread

  const getBarColor = (numeric, label) => {
    // Bolder, more vibrant colors for better visibility
    const numericColors = {
      1: '#ef4444', // Red
      2: '#f97316', // Orange
      3: '#eab308', // Yellow
      4: '#22c55e', // Green
      5: '#3b82f6', // Blue
      6: '#8b5cf6', // Purple
    }

    if (numeric !== null) {
      return numericColors[numeric] || '#6b7280'
    }

    const generatedColors = generatedColorsRef.current
    const hueIndex = hueIndexRef.current

    if (!generatedColors[label]) {
      const hue = distinctHues[hueIndex % distinctHues.length]
      // More saturated colors for better visibility
      const color = `hsl(${hue}, 80%, 50%)`
      generatedColors[label] = color
      hueIndexRef.current++
    }

    return generatedColors[label]
  }

  // Helper function to get sort order for different label types
  const getSortOrder = (label) => {
    // Handle simple numeric ratings (1-6)
    const numeric = parseInt(label)
    if (!isNaN(numeric) && label.trim() === numeric.toString()) {
      return numeric
    }
    
    // Handle class standing ordering (freshman → other)
    const classStandingOrder = {
      freshman: 1,
      sophomore: 2,
      junior: 3,
      senior: 4,
      graduate: 5,
      professional: 6,
      other: 7,
    }
    const normalized = String(label).toLowerCase().trim()
    if (classStandingOrder[normalized] !== undefined) {
      return classStandingOrder[normalized] + 100
    }
    
    // Handle hours per week ranges
    const hourRanges = {
      '3 or fewer': 1,
      '4 - 7': 2,
      '8 - 11': 3,
      '12 - 15': 5,
      '16 - 19': 6,
      '20 or more': 7,
    }
    
    if (hourRanges[label] !== undefined) {
      return hourRanges[label] + 100 // Offset to sort after numeric ratings
    }
    
    // Default alphabetical sort for other labels
    return 1000 + label.charCodeAt(0)
  }

  // Normalize and sort chart data
  const chartData = Object.entries(distribution || {})
    .map(([label, count]) => {
      const numeric = parseInt(label)
      const isNumeric = !isNaN(numeric) && label.trim() === numeric.toString()
      return {
        label,
        numeric: isNumeric ? numeric : null,
        count,
        percentage: 0,
        sortOrder: getSortOrder(label)
      }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // Compute totals and percentages
  const totalResponses = chartData.reduce((sum, item) => sum + item.count, 0)
  const averageRating = calculateAverageRating(distribution)

  chartData.forEach((item) => {
    item.percentage =
      totalResponses > 0
        ? parseFloat(((item.count / totalResponses) * 100).toFixed(1))
        : 0
  })

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="chart-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-label">{label}</span>
          </div>
          <div className="tooltip-content">
            <div className="tooltip-stat">
              <span>Count:</span>
              <span className="tooltip-count">{data.count}</span>
            </div>
            <div className="tooltip-stat">
              <span>Percentage:</span>
              <span className="tooltip-percentage">{data.percentage}%</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

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
        <div className="chart-stats">
          <p className="total-responses">Total: {totalResponses} responses</p>
          {averageRating > 0 && (
            <p className="average-rating">Average: {averageRating.toFixed(1)}/6</p>
          )}
        </div>
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
          <Tooltip content={<CustomTooltip />} />
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
