import { useMemo } from 'react';
import * as THREE from 'three';

interface Props {
  radius: number;
  /** Degrees. */
  inclination?: number;
  color: string;
  opacity?: number;
  segments?: number;
}

/**
 * A single orbital path. Built as a THREE.Line object rather than a
 * `<line>` JSX tag, because that tag collides with SVG's line in the type
 * system. Drawn as a loop rather than a torus — a torus at this radius
 * costs hundreds of triangles to look like a circle, and orbital paths
 * should read as annotation, not geometry.
 */
export function OrbitPath({
  radius,
  inclination = 0,
  color,
  opacity = 0.12,
  segments = 128,
}: Props) {
  const line = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      points.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const obj = new THREE.Line(geometry, material);
    obj.rotation.z = THREE.MathUtils.degToRad(inclination);
    return obj;
  }, [radius, segments, color, opacity, inclination]);

  return <primitive object={line} />;
}
