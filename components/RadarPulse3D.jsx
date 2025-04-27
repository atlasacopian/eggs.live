import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function RadarPulse3D({ count = 3, color = '#ffc107', maxScale = 4, cycle = 4, maxOpacity = 0.4 }) {
  const groupRef = useRef()
  const ringRefs = useRef([])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ringRefs.current.forEach((mesh, idx) => {
      if (!mesh) return
      const delay = (cycle / count) * idx
      const time = (t - delay + cycle) % cycle
      const progress = time / cycle
      // scale from 0 to maxScale
      const scaleVal = THREE.MathUtils.lerp(0, maxScale, progress)
      mesh.scale.setScalar(scaleVal)
      // fade opacity from maxOpacity to 0
      mesh.material.opacity = THREE.MathUtils.lerp(maxOpacity, 0, progress)
    })
  })

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      {Array.from({ length: count }).map((_, idx) => (
        <mesh key={idx} ref={el => (ringRefs.current[idx] = el)} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.2, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
} 