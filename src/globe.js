import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export const createGlobe = (container, initialDataPoints = []) => {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 200)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.25
  controls.enableZoom = true

  const textureLoader = new THREE.TextureLoader()
  const earthTexture = textureLoader.load("img/map.png")
  const bumpMap = textureLoader.load(
    "img/map_inverted.png",
    (bumpMapTexture) => {
      const glowTexture = textureLoader.load("img/earth-glow2.jpg")

      const globeGeometry = new THREE.SphereGeometry(100, 50, 50)
      const globeMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpScale: 0.2,
        specular: new THREE.Color("blue"),
        shininess: 5,
        transparent: true,
        opacity: 0.8,
      })
      const globe = new THREE.Mesh(globeGeometry, globeMaterial)
      scene.add(globe)

      const ambientLight = new THREE.AmbientLight(0x00aaff, 0.1)
      scene.add(ambientLight)

      const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        color: new THREE.Color(0x00aaff),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 1,
      })
      const glowSprite = new THREE.Sprite(glowMaterial)
      glowSprite.scale.set(250, 250, 1)
      globe.add(glowSprite)

      const colorBase = new THREE.Color(0x00aaff)
      const lightShieldIntensity = 1.0
      const lightShieldDistance = 1000
      const lightShieldDecay = 2.0

      const lightShield1 = new THREE.PointLight(
        colorBase,
        lightShieldIntensity,
        lightShieldDistance,
        lightShieldDecay
      )
      lightShield1.position.set(-50, 150, 75)
      scene.add(lightShield1)

      const lightShield2 = new THREE.PointLight(
        colorBase,
        lightShieldIntensity,
        lightShieldDistance,
        lightShieldDecay
      )
      lightShield2.position.set(100, 50, 50)
      scene.add(lightShield2)

      const lightShield3 = new THREE.PointLight(
        colorBase,
        lightShieldIntensity,
        lightShieldDistance,
        lightShieldDecay
      )
      lightShield3.position.set(0, -300, 50)
      scene.add(lightShield3)

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

        const globeCloudVerticesArray = []
        const canvas = document.createElement("canvas")
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext("2d")
        context.drawImage(image, 0, 0, image.width, image.height)

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        )

        for (let i = 0; i < imageData.data.length; i += 4) {
          const x = (i / 4) % canvas.width
          const y = (i / 4 - x) / canvas.width
          if ((i / 4) % 2 === 1 && y % 2 === 1) {
            const alpha = imageData.data[i]
            if (alpha === 0) {
              const lat = (y / (canvas.height / 180) - 90) / -1
              const long = x / (canvas.width / 360) - 180
              const position = latLongToXYZ(lat, long, 100)
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
          new THREE.BufferAttribute(positions, 3)
        )

        const colors = new Float32Array(3 * globeCloudVerticesArray.length)
        for (let i = 0; i < globeCloudVerticesArray.length; i++) {
          const color = new THREE.Color(0x00aaff)
          colors[3 * i] = color.r
          colors[3 * i + 1] = color.g
          colors[3 * i + 2] = color.b
        }
        globeCloudBufferGeometry.setAttribute(
          "color",
          new THREE.BufferAttribute(colors, 3)
        )

        const globeCloudMaterial = new THREE.PointsMaterial({
          size: 0.75,
          fog: true,
          vertexColors: true,
          depthWrite: false,
        })

        globeCloud = new THREE.Points(
          globeCloudBufferGeometry,
          globeCloudMaterial
        )
        globeCloud.sortParticles = true
        globeCloud.name = "globeCloud"
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
    }
  )
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
    canvas.width / 2
  )
  gradient.addColorStop(0, "rgba(255, 0, 0, 1)")
  gradient.addColorStop(0.5, "rgba(255, 0, 0, 0.5)")
  gradient.addColorStop(1, "rgba(0, 170, 255, 0)")

  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  return new THREE.CanvasTexture(canvas)
}

const addDotsToGlobe = (earthObject, globeCloudVerticesArray, image) => {
  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext("2d")
  context.drawImage(image, 0, 0, image.width, image.height)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < imageData.data.length; i += 4) {
    const x = (i / 4) % canvas.width
    const y = (i / 4 - x) / canvas.width
    if ((i / 4) % 2 === 1 && y % 2 === 1) {
      const alpha = imageData.data[i]
      if (alpha === 0) {
        const lat = (y / (canvas.height / 180) - 90) / -1
        const long = x / (canvas.width / 360) - 180
        const position = latLongToXYZ(lat, long, 100)
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
    new THREE.BufferAttribute(positions, 3)
  )

  const colors = new Float32Array(3 * globeCloudVerticesArray.length)
  for (let i = 0; i < globeCloudVerticesArray.length; i++) {
    const color = new THREE.Color(0x00aaff)
    colors[3 * i] = color.r
    colors[3 * i + 1] = color.g
    colors[3 * i + 2] = color.b
  }
  globeCloudBufferGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3)
  )

  const globeCloudMaterial = new THREE.PointsMaterial({
    size: 0.75,
    fog: true,
    vertexColors: true,
    depthWrite: false,
  })

  globeCloud = new THREE.Points(globeCloudBufferGeometry, globeCloudMaterial)
  globeCloud.sortParticles = true
  globeCloud.name = "globeCloud"
  earthObject.add(globeCloud)
}
