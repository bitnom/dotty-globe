import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

const EARTH_TEXTURE_IMAGE = "img/map.png"
const BUMP_MAP_IMAGE = "img/map_inverted.png"

export const createGlobe = (container, initialDataPoints = []) => {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  )
  camera.position.set(0, 0, 200)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.25
  controls.enableZoom = true

  const textureLoader = new THREE.TextureLoader()
  const earthTexture = textureLoader.load(EARTH_TEXTURE_IMAGE)
  const bumpMap = textureLoader.load(BUMP_MAP_IMAGE, (bumpMapTexture) => {
    const globe = createGlobeMesh(earthTexture)
    globe.renderOrder = 1
    scene.add(globe)

    const ambientLight = new THREE.AmbientLight(0x00aaff, 0.1)
    scene.add(ambientLight)

    const pointLights = createPointLights()
    pointLights.forEach((light) => scene.add(light))

    const dataPointsGroup = new THREE.Group()
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
        const spike = createSpike(spikeHeight, intensity, x, y, z)
        dataPointsGroup.add(spike)

        const ringPulse = createRingPulse(intensity, x, y, z)
        dataPointsGroup.add(ringPulse)
      })
    }

    const updateDots = (image) => {
      if (globeCloud) {
        globe.remove(globeCloud)
      }

      globeCloud = createGlobeCloud(image)
      globeCloud.renderOrder = 2
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
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", onWindowResize, false)

    updateDataPoints(initialDataPoints)
    updateDots(bumpMapTexture.image)
    animate()

    container.updateData = (newDataPoints) => {
      updateDataPoints(newDataPoints)
    }

    container.updateDots = (newImage) => {
      updateDots(newImage)
    }
  })
}

const createGlobeMesh = (earthTexture) => {
  const globeGeometry = new THREE.SphereGeometry(100, 50, 50)
  const globeMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpScale: 0.2,
    specular: new THREE.Color("blue"),
    shininess: 5,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  })
  return new THREE.Mesh(globeGeometry, globeMaterial)
}

const createPointLights = () => {
  const colorBase = new THREE.Color(0x00aaff)
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

const createSpike = (height, intensity, x, y, z) => {
  const geometry = new THREE.CylinderGeometry(0.1, 0.2, height, 32)
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xff0000).multiplyScalar(intensity),
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

const createRingPulse = (intensity, x, y, z) => {
  const ringGeometry = new THREE.RingGeometry(0.2, 0.5 + 3 * intensity, 32)
  const ringMaterial = new THREE.MeshBasicMaterial({
    map: createGlowTexture(),
    color: new THREE.Color(0xff0000).multiplyScalar(intensity),
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

const createGlowTexture = () => {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext("2d")

  const gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2,
  )
  gradient.addColorStop(0, "rgba(255, 0, 0, 1)")
  gradient.addColorStop(0.5, "rgba(255, 0, 0, 0.5)")
  gradient.addColorStop(1, "rgba(0, 170, 255, 0)")

  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  return new THREE.CanvasTexture(canvas)
}

const createGlobeCloud = (image) => {
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
    color: 0x00aaff,
    fog: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  })

  const globeCloud = new THREE.Points(
    globeCloudBufferGeometry,
    globeCloudMaterial,
  )
  globeCloud.name = "globeCloud"

  return globeCloud
}
