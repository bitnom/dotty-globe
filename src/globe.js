import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export const createGlobe = (container, dataPoints = []) => {
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

  const globeGeometry = new THREE.SphereGeometry(100, 50, 50)
  const globeMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load("img/earth-day.jpg"),
    bumpScale: 0.05,
    specular: new THREE.Color("grey"),
    transparent: true,
    opacity: 0.8,
  })
  const globe = new THREE.Mesh(globeGeometry, globeMaterial)
  scene.add(globe)

  scene.add(new THREE.AmbientLight(0xffffff, 1))

  const dataPointsGroup = new THREE.Group()
  globe.add(dataPointsGroup)

  const glowTexture = new THREE.CanvasTexture(createGlowCanvas())

  dataPoints.forEach((point) => {
    const { coordinate, intensity } = point
    const [lat, long] = coordinate

    const { x, y, z } = latLongToXYZ(lat, long, 100)

    const pillarHeight = intensity * 30
    const pillar = createPillar(pillarHeight, intensity, x, y, z)
    dataPointsGroup.add(pillar)

    const glowSprite = createGlowSprite(glowTexture, intensity, x, y, z)
    dataPointsGroup.add(glowSprite)
  })

  const animate = () => {
    requestAnimationFrame(animate)
    globe.rotation.y += 0.002
    controls.update()
    renderer.render(scene, camera)
  }

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  window.addEventListener("resize", onWindowResize, false)

  animate()
}

const createGlowCanvas = () => {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, "rgba(255, 0, 0, 1)")
  gradient.addColorStop(1, "rgba(255, 0, 0, 0)")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  return canvas
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

const createPillar = (height, intensity, x, y, z) => {
  const geometry = new THREE.CylinderGeometry(0.1, 0.1, height, 32)
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1, 0, 0).multiplyScalar(intensity),
    transparent: true,
    opacity: 0.6,
  })
  const pillar = new THREE.Mesh(geometry, material)

  pillar.position.set(x, y, z)
  pillar.lookAt(new THREE.Vector3(x, y, z).multiplyScalar(2))
  pillar.rotateX(Math.PI / 2)
  pillar.translateY(height / 2)

  return pillar
}

const createGlowSprite = (texture, intensity, x, y, z) => {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: 0xff0000,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.8,
    depthTest: false,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(10 * intensity, 10 * intensity, 1)
  sprite.position.set(x, y, z)

  return sprite
}
