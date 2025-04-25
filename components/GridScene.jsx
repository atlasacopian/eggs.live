import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

export default function GridScene() {
  const { floorGroup } = useMemo(() => {
    const group = new THREE.Group()
    // Black floor plane
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: '#000' })
    )
    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true
    group.add(plane)
    // White grid helper
    const grid = new THREE.GridHelper(100, 100, '#ffffff', '#ffffff')
    grid.material.opacity = 0.3
    grid.material.transparent = true
    group.add(grid)
    return { floorGroup: group }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas>
        <color attach="background" args={['black']} />
        <ambientLight intensity={0.5} />
        <primitive object={floorGroup} />
      </Canvas>
    </div>
  )
} 