import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import earthTextureImage from "../public/img/map.png"
import bumpMapImage from "../public/img/map_inverted.png"

export const createGlobe = (
  container,
  initialDataPoints = [],
  globeColor = 0x00aaff,
  spikeColor = 0xff0000,
) => {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  )
  camera.position.set(0, 0, 200)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.25
  controls.enableZoom = true

  const textureLoader = new THREE.TextureLoader()
  const earthTexture = textureLoader.load(earthTextureImage)
  const bumpMap = textureLoader.load(bumpMapImage, (bumpMapTexture) => {
    const globe = createGlobeMesh(earthTexture, globeColor)
    globe.renderOrder = 10
    scene.add(globe)

    const ambientLight = new THREE.AmbientLight(globeColor, 0.1)
    scene.add(ambientLight)

    const pointLights = createPointLights(globeColor)
    pointLights.forEach((light) => scene.add(light))

    const dataPointsGroup = new THREE.Group()
    dataPointsGroup.name = "dataPointsGroup"
    dataPointsGroup.renderOrder = 15
    globe.add(dataPointsGroup)

    let globeCloud

    const updateDataPoints = (dataPoints) => {
      while (dataPointsGroup.children.length) {
        dataPointsGroup.remove(dataPointsGroup.children[0])
      }

      dataPoints.forEach((point) => {
        const { coordinate, intensity } = point
        const [lat, long] = coordinate

        const { x, y, z } = latLongToXYZ(lat, long, 100)

        const spikeHeight = intensity * 30
        const spike = createSpike(spikeColor, spikeHeight, intensity, x, y, z)
        dataPointsGroup.add(spike)

        const ringPulse = createRingPulse(spikeColor, intensity, x, y, z)
        dataPointsGroup.add(ringPulse)
      })
    }

    const updateDots = (image) => {
      if (globeCloud) {
        globe.remove(globeCloud)
      }

      globeCloud = createGlobeCloud(image, globeColor)
      globeCloud.renderOrder = 1
      globe.add(globeCloud)
    }

    const animate = () => {
      requestAnimationFrame(animate)
      globe.rotation.y += 0.002
      dataPointsGroup.children.forEach((child) => {
        if (child.name === "ringPulse") {
          child.rotation.z += 0.01
        }
      })
      controls.update()
      renderer.render(scene, camera)
    }

    const onWindowResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    window.addEventListener("resize", onWindowResize, false)

    updateDataPoints(initialDataPoints)
    updateDots(bumpMapTexture.image)
    animate()
  })

  return {
    update: (newDataPoints) => {
      const dataPointsGroup = scene.getObjectByName("dataPointsGroup")
      if (dataPointsGroup) {
        while (dataPointsGroup.children.length) {
          dataPointsGroup.remove(dataPointsGroup.children[0])
        }

        newDataPoints.forEach((point) => {
          const { coordinate, intensity } = point
          const [lat, long] = coordinate

          const { x, y, z } = latLongToXYZ(lat, long, 100)

          const spikeHeight = intensity * 30
          const spike = createSpike(spikeColor, spikeHeight, intensity, x, y, z)
          dataPointsGroup.add(spike)

          const ringPulse = createRingPulse(intensity, x, y, z)
          dataPointsGroup.add(ringPulse)
        })
      }
    },
  }
}

const createGlobeMesh = (earthTexture, specularColor) => {
  const globeGeometry = new THREE.SphereGeometry(100, 50, 50)
  const globeMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpScale: 10000,
    specular: new THREE.Color(specularColor),
    shininess: 1,
    transparent: true,
    opacity: 0.75,
    depthWrite: true,
  })
  return new THREE.Mesh(globeGeometry, globeMaterial)
}

const createPointLights = (color) => {
  const colorBase = new THREE.Color(color)
  const intensity = 1.0
  const distance = 1000
  const decay = 2.0

  return [
    new THREE.PointLight(colorBase, intensity, distance, decay),
    new THREE.PointLight(colorBase, intensity, distance, decay),
    new THREE.PointLight(colorBase, intensity, distance, decay),
  ].map((light, index) => {
    switch (index) {
      case 0:
        light.position.set(-50, 150, 75)
        break
      case 1:
        light.position.set(100, 50, 50)
        break
      case 2:
        light.position.set(0, -300, 50)
        break
    }
    return light
  })
}

const latLongToXYZ = (lat, long, radius) => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (long + 180) * (Math.PI / 180)

  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }
}

const createSpike = (color, height, intensity, x, y, z) => {
  const geometry = new THREE.CylinderGeometry(0.1, 0.2, height, 32)
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    transparent: true,
    opacity: 0.6,
  })
  const spike = new THREE.Mesh(geometry, material)

  spike.position.set(x, y, z)
  spike.lookAt(new THREE.Vector3(x, y, z).multiplyScalar(2))
  spike.rotateX(Math.PI / 2)
  spike.translateY(height / 2)

  return spike
}

const createRingPulse = (color, intensity, x, y, z) => {
  const ringGeometry = new THREE.RingGeometry(0.2, 0.5 + 3 * intensity, 32)
  const ringMaterial = new THREE.MeshBasicMaterial({
    map: createGlowTexture(color),
    color: new THREE.Color(color).multiplyScalar(intensity),
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    opacity: 0.6,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)

  ring.renderOrder = 3
  ring.position.set(x, y, z)
  ring.lookAt(new THREE.Vector3(0, 0, 0))
  ring.name = "ringPulse"

  return ring
}

const createGlowTexture = (color) => {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext("2d")

  const threeColor = new THREE.Color(color)
  const r = Math.floor(threeColor.r * 255)
  const g = Math.floor(threeColor.g * 255)
  const b = Math.floor(threeColor.b * 255)

  const gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2,
  )
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`)
  gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.5)`)
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  return new THREE.CanvasTexture(canvas)
}

const createGlobeCloud = (image, color) => {
  const globeCloudVerticesArray = []
  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext("2d")
  context.drawImage(image, 0, 0, image.width, image.height)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const totalPoints = 75000
  const phi = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < totalPoints; i++) {
    const y = 1 - (i / (totalPoints - 1)) * 2
    const radius = Math.sqrt(1 - y * y)

    const theta = phi * i

    const x = Math.cos(theta) * radius
    const z = Math.sin(theta) * radius

    let lat = Math.asin(y) * (180 / Math.PI)
    let long = Math.atan2(z, x) * (180 / Math.PI)

    long = -long

    const imageX = Math.floor(((long + 180) / 360) * canvas.width)
    const imageY = Math.floor(((90 - lat) / 180) * canvas.height)

    if (
      imageX >= 0 &&
      imageX < canvas.width &&
      imageY >= 0 &&
      imageY < canvas.height
    ) {
      const index = (imageY * canvas.width + imageX) * 4
      const red = imageData.data[index]
      const green = imageData.data[index + 1]
      const blue = imageData.data[index + 2]

      if (red < 50 && green < 50 && blue < 50) {
        const position = { x: x * 100, y: y * 100, z: z * 100 }
        globeCloudVerticesArray.push(position)
      }
    }
  }

  const globeCloudBufferGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(3 * globeCloudVerticesArray.length)
  for (let i = 0; i < globeCloudVerticesArray.length; i++) {
    positions[3 * i] = globeCloudVerticesArray[i].x
    positions[3 * i + 1] = globeCloudVerticesArray[i].y
    positions[3 * i + 2] = globeCloudVerticesArray[i].z
  }
  globeCloudBufferGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  )

  const globeCloudMaterial = new THREE.PointsMaterial({
    size: 0.75,
    color,
    fog: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: true,
    depthTest: true,
  })

  const globeCloud = new THREE.Points(
    globeCloudBufferGeometry,
    globeCloudMaterial,
  )
  globeCloud.name = "globeCloud"

  return globeCloud
}
