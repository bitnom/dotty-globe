import { createGlobe } from "./globe"

const dataPoints = [
  { key: "1", label: "Point 1", lat: 37.7749, long: -122.4194, intensity: 10 },
  { key: "2", label: "Point 2", lat: 51.5074, long: -0.1278, intensity: 20 },
  // Add more data points as needed
]

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("globe-container")
  createGlobe(container, dataPoints)
})
