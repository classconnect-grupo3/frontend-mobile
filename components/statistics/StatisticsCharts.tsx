"use client"
import React from "react"
import { View, Text, StyleSheet, Dimensions } from "react-native"
import { PieChart, BarChart, LineChart, ProgressChart } from "react-native-chart-kit"

const screenWidth = Dimensions.get("window").width

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#007AFF",
  },
}

interface ProgressCircleProps {
  title: string
  data: Array<{
    name: string
    population: number
    color: string
    legendFontColor: string
    legendFontSize: number
  }>
}

export const ProgressCircle = ({ title, data }: ProgressCircleProps) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <ProgressChart
      data={{
        labels: data.map((d) => d.name),
        data: data.map((d) => d.population / 100),
      }}
      width={screenWidth - 32}
      height={220}
      strokeWidth={16}
      radius={32}
      chartConfig={chartConfig}
      hideLegend={false}
    />
  </View>
)

interface CustomBarChartProps {
  title: string
  data: {
    labels: string[]
    datasets: Array<{
      data: number[]
      color?: (opacity: number) => string
    }>
  }
}

export const CustomBarChart = ({ title, data }: CustomBarChartProps) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <BarChart
      data={data}
      width={screenWidth - 32}
      height={220}
      yAxisLabel=""
      yAxisSuffix=""
      chartConfig={chartConfig}
      verticalLabelRotation={30}
      showValuesOnTopOfBars
    />
  </View>
)

interface CustomPieChartProps {
  title: string
  data: Array<{
    name: string
    population: number
    color: string
    legendFontColor: string
    legendFontSize: number
  }>
}

export const CustomPieChart = ({ title, data }: CustomPieChartProps) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <View style={styles.pieChartWrapper}>
      <PieChart
        data={data}
        width={screenWidth - 64}
        height={200}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[0, 0]}
        absolute
      />
    </View>
  </View>
)

interface CustomLineChartProps {
  title: string
  data: {
    labels: string[]
    datasets: Array<{
      data: number[]
      color?: (opacity: number) => string
      strokeWidth?: number
    }>
  }
}

export const CustomLineChart = ({ title, data }: CustomLineChartProps) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <LineChart data={data} width={screenWidth - 32} height={220} chartConfig={chartConfig} bezier />
  </View>
)

interface GaugeChartProps {
  title: string
  value: number
  maxValue: number
  color: string
}

export const GaugeChart = ({ title, value, maxValue, color }: GaugeChartProps) => {
  const percentage = (value / maxValue) * 100

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeBackground}>
          <View
            style={[
              styles.gaugeFill,
              {
                width: `${percentage}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <Text style={styles.gaugeText}>
          {value.toFixed(1)} / {maxValue}
        </Text>
        <Text style={styles.gaugePercentage}>{percentage.toFixed(1)}%</Text>
      </View>
    </View>
  )
}

// New component for displaying percentage values
interface PercentageDisplayProps {
  title: string
  data: Array<{
    name: string
    value: number
    color: string
  }>
}

export const PercentageDisplay = ({ title, data }: PercentageDisplayProps) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <View style={styles.percentageGrid}>
      {data.map((item, index) => (
        <View key={index} style={styles.percentageItem}>
          <View style={[styles.percentageIndicator, { backgroundColor: item.color }]} />
          <Text style={styles.percentageName}>{item.name}</Text>
          <Text style={styles.percentageValue}>{item.value.toFixed(1)}%</Text>
        </View>
      ))}
    </View>
  </View>
)

// New component for displaying numeric values
interface NumericDisplayProps {
  title: string
  data: Array<{
    name: string
    value: number
    color: string
    suffix?: string
  }>
}

export const NumericDisplay = ({ title, data }: NumericDisplayProps) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <View style={styles.numericGrid}>
      {data.map((item, index) => (
        <View key={index} style={styles.numericItem}>
          <View style={[styles.numericIndicator, { backgroundColor: item.color }]} />
          <View style={styles.numericContent}>
            <Text style={styles.numericName}>{item.name}</Text>
            <Text style={styles.numericValue}>
              {item.value.toFixed(1)}
              {item.suffix || ""}
            </Text>
          </View>
        </View>
      ))}
    </View>
  </View>
)

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gaugeContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  gaugeBackground: {
    width: 200,
    height: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  gaugeFill: {
    height: "100%",
    borderRadius: 10,
  },
  gaugeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  gaugePercentage: {
    fontSize: 14,
    color: "#666",
  },
  percentageGrid: {
    gap: 12,
  },
  percentageItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  percentageIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  percentageName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  percentageValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  numericGrid: {
    gap: 12,
  },
  numericItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  numericIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  numericContent: {
    flex: 1,
  },
  numericName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  numericValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
})
