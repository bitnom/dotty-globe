import Globe from "./Globe"

const dataPoints = [
  { key: "1", label: "Point 1", lat: 37.7749, long: -122.4194, intensity: 10 },
  { key: "2", label: "Point 2", lat: 51.5074, long: -0.1278, intensity: 20 },
]

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("globe-container")
  new Globe(container, dataPoints)
})
