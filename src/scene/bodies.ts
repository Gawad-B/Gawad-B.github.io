import type * as THREE from 'three';

/**
 * Registry of the orbiting bodies, by world id.
 *
 * The camera can no longer be steered by static waypoints: in a
 * heliocentric scene every destination is moving. Bodies register their
 * scene-graph node here on mount, and the rig resolves "where is Saturn
 * right now" each frame from the live transform.
 */
const bodies = new Map<string, THREE.Object3D>();

export function registerBody(id: string, object: THREE.Object3D) {
  bodies.set(id, object);
}

export function unregisterBody(id: string) {
  bodies.delete(id);
}

export function getBody(id: string): THREE.Object3D | undefined {
  return bodies.get(id);
}

export function getBodies(ids: string[]): THREE.Object3D[] {
  return ids.map((id) => bodies.get(id)).filter((o): o is THREE.Object3D => !!o);
}
