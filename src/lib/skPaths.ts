export const SK_PATHS = {
  speedOverGround: 'navigation.speedOverGround',
  depthBelowKeel: 'environment.depth.belowKeel',
  position: 'navigation.position',
  courseOverGroundTrue: 'navigation.courseOverGroundTrue',
} as const

export type SkPathKey = keyof typeof SK_PATHS
