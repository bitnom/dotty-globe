import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export function createGlobe(container, dataPoints) {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 200) // Set a default camera position

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.25
  controls.enableZoom = true
  controls.update() // Initial update for controls

  const globeGeometry = new THREE.SphereGeometry(100, 50, 50)
  const globeMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load("earth-day.jpg"), // Make sure the path to your texture is correct
    bumpScale: 0.05,
    specular: new THREE.Color("grey"),
    transparent: true,
    opacity: 0.3, // Adjust the opacity to make it transparent
    blending: THREE.NormalBlending, // Use normal blending for transparency
    depthWrite: false, // Disable depth write for proper transparency rendering
  })

  globeMaterial.emissiveIntensity = 0.1
  globeMaterial.shininess = 0.7

  const globe = new THREE.Mesh(globeGeometry, globeMaterial)
  scene.add(globe)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight)

  function animate() {
    requestAnimationFrame(animate)

    globe.rotation.y += 0.002
    controls.update()

    renderer.render(scene, camera)
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  window.addEventListener("resize", onWindowResize, false)

  animate()
}
