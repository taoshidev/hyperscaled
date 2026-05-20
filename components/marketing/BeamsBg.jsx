'use client'

import Beams from '@/components/ui/Beams/Beams'

export default function BeamsBg({ className = '' }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <Beams
        beamWidth={5}
        beamHeight={12}
        beamNumber={15}
        lightColor="#97fce4"
        speed={2}
        noiseIntensity={1.75}
        scale={0.15}
        rotation={0}
      />
    </div>
  )
}
