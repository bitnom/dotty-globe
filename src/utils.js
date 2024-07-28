export function polar2Cartesian(lat, lng) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((180 - lng) * Math.PI) / 180

  return {
    x: 100 * Math.sin(phi) * Math.cos(theta),
    y: 100 * Math.cos(phi),
    z: 100 * Math.sin(phi) * Math.sin(theta),
  }
}
