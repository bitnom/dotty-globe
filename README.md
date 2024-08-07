# Dotty Globe

A simple and interactive 3D globe visualization using ThreeJS. Perfect for displaying data points dynamically on a rotating globe.

![Globe Animation](screenshots/globe.gif)

The globe uses a 3D point cloud to draw the continents and dynamic spikes to visualize varying data intensities on the globe's surface.

## Quick start

To install the dotty-globe package:

```bash
npm install dotty-globe
```

Create a container for the globe in your HTML:

```html
<div id="globe-container" style="width: 500px; height: 500px;"></div>
```

Initialize the container with JavaScript:

```javascript
const container = document.getElementById("globe-container")
createGlobe(container, dataPoints)
```

## Usage Example

To update the points on the globe dynamically, you can use the following example in a React component:

```typescript
import { useEffect, useRef, useState } from "react"
import { createGlobe } from "dotty-globe"

export default function Home() {
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const [dataPoints, setDataPoints] = useState([])

  useEffect(() => {
    if (containerRef.current) {
      globeRef.current = createGlobe(containerRef.current, dataPoints)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const newPoint = {
        label: `Random Point`,
        key: `key-${Math.random()}`,
        metadata: {},
        coordinate: [
          parseFloat((Math.random() * 180 - 90).toFixed(4)),
          parseFloat((Math.random() * 360 - 180).toFixed(4)),
        ],
        intensity: Math.random().toFixed(2),
      }
      setDataPoints((prevPoints) => {
        const updatedPoints = [...prevPoints, newPoint]
        return updatedPoints.length > 15
          ? updatedPoints.slice(1)
          : updatedPoints
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.update(dataPoints)
    }
  }, [dataPoints])

  return (
    <main>
      <div className="flex justify-center">
        <div
          id="globe-container"
          style={{
            height: "500px",
            width: "500px",
          }}
          ref={containerRef}
        ></div>
      </div>
    </main>
  )
}

```

In this example, a new random point is generated every 100 milliseconds and added to the globe. If the number of points exceeds 15, the oldest point is removed. The globe is updated with the new set of data points whenever they change.

## Develop

To start developing with the dotty-globe package, clone the repository and install the dependencies:

```bash
git checkout https://github.com/blairjordan/dotty-globe
npm install
npm run dev
```

This will start a development server that you can use to see your changes live.

### Build

To build the project for production, run:

```bash
npm run build
```

This will create an optimized build of the project in the dist directory.

## Contributing

If you would like to contribute to the project, please follow these steps:

1. Fork the repository.
1. Create a new branch with a descriptive name (`git checkout -b feat/new-feature`).
1. Commit your changes (`git commit -am 'feat: add some feature'`).
1. Push to the branch (`git push origin feat/new-feature`).
1. Create a new Pull Request.
