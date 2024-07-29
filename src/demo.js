import { createGlobe } from "./globe"

const dataPoints = [
  {
    label: "Perth",
    key: "p3",
    metadata: {},
    coordinate: [-31.9514, 115.8617],
    intensity: 0.9,
  },
  {
    label: "San Francisco",
    key: "sf",
    metadata: {},
    coordinate: [37.7749, -122.4194],
    intensity: 0.8,
  },
  {
    label: "New York",
    key: "ny",
    metadata: {},
    coordinate: [40.7128, -74.006],
    intensity: 0.5,
  },
  {
    label: "London",
    key: "ldn",
    metadata: {},
    coordinate: [51.5074, -0.1278],
    intensity: 0.4,
  },
  {
    label: "Tokyo",
    key: "tk",
    metadata: {},
    coordinate: [35.6895, 139.6917],
    intensity: 0.9,
  },
  {
    label: "Sydney",
    key: "syd",
    metadata: {},
    coordinate: [-33.8688, 151.2093],
    intensity: 0.6,
  },
  {
    label: "Paris",
    key: "par",
    metadata: {},
    coordinate: [48.8566, 2.3522],
    intensity: 0.7,
  },
  {
    label: "Berlin",
    key: "ber",
    metadata: {},
    coordinate: [52.52, 13.405],
    intensity: 0.5,
  },
  {
    label: "Moscow",
    key: "msk",
    metadata: {},
    coordinate: [55.7558, 37.6173],
    intensity: 0.8,
  },
  {
    label: "Rio de Janeiro",
    key: "rio",
    metadata: {},
    coordinate: [-22.9068, -43.1729],
    intensity: 0.7,
  },
  {
    label: "Cape Town",
    key: "cpt",
    metadata: {},
    coordinate: [-33.9249, 18.4241],
    intensity: 0.4,
  },
  {
    label: "Mumbai",
    key: "mum",
    metadata: {},
    coordinate: [19.076, 72.8777],
    intensity: 0.2,
  },
  {
    label: "Beijing",
    key: "bj",
    metadata: {},
    coordinate: [39.9042, 116.4074],
    intensity: 0.9,
  },
  {
    label: "Singapore",
    key: "sg",
    metadata: {},
    coordinate: [1.3521, 103.8198],
    intensity: 0.7,
  },
  {
    label: "Hong Kong",
    key: "hk",
    metadata: {},
    coordinate: [22.3193, 114.1694],
    intensity: 0.8,
  },
]

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("globe-container")
  createGlobe(container, dataPoints)
})
