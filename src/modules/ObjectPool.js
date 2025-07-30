/**
 * ObjectPool.js - Performance Optimization and Object Reuse
 * This module implements object pooling for 3D meshes and materials to improve performance by
 * reusing objects instead of creating new ones. It manages the lifecycle of 3D objects, handles
 * efficient object allocation and deallocation, and provides memory optimization for smooth
 * animations and dynamic shape changes.
 */

import * as THREE from 'three';

export class ObjectPool {
    constructor() {
        this.geometryPool = new Map(); // shapeName -> Array of geometries
        this.meshPool = new Map(); // shapeName -> Array of meshes
        this.maxPoolSize = 50; // Maximum objects to keep in pool per type
        this.disposedObjects = new Set(); // Track disposed objects to prevent reuse
    }

    // Get a geometry from pool or create new one
    getGeometry(shapeName, shapeGenerator) {
        // Check if we have a pooled geometry
        if (this.geometryPool.has(shapeName) && this.geometryPool.get(shapeName).length > 0) {
            const geometry = this.geometryPool.get(shapeName).pop();
            if (!this.disposedObjects.has(geometry)) {
                return geometry;
            }
        }

        // Create new geometry
        const shapeObj = shapeGenerator.generateShape(shapeName);
        if (!shapeObj) return null;

        let geometry;
        if (shapeObj instanceof THREE.Group) {
            geometry = shapeObj.children[0].geometry.clone();
        } else if (shapeObj instanceof THREE.Shape) {
            geometry = new THREE.ShapeGeometry(shapeObj);
        } else if (shapeObj instanceof THREE.BufferGeometry) {
            geometry = shapeObj.clone();
        } else {
            geometry = new THREE.PlaneGeometry(1, 1);
        }

        return geometry;
    }

    // Return a geometry to the pool
    returnGeometry(shapeName, geometry) {
        if (!geometry || this.disposedObjects.has(geometry)) return;

        // Reset geometry attributes
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.normal.needsUpdate = true;
        if (geometry.attributes.uv) {
            geometry.attributes.uv.needsUpdate = true;
        }

        // Add to pool
        if (!this.geometryPool.has(shapeName)) {
            this.geometryPool.set(shapeName, []);
        }

        const pool = this.geometryPool.get(shapeName);
        if (pool.length < this.maxPoolSize) {
            pool.push(geometry);
        } else {
            // Dispose if pool is full
            geometry.dispose();
        }
    }

    // Get a mesh from pool or create new one
    getMesh(shapeName, material) {
        // Check if we have a pooled mesh
        if (this.meshPool.has(shapeName) && this.meshPool.get(shapeName).length > 0) {
            const mesh = this.meshPool.get(shapeName).pop();
            if (!this.disposedObjects.has(mesh)) {
                // Reset mesh properties
                mesh.position.set(0, 0, 0);
                mesh.rotation.set(0, 0, 0);
                mesh.scale.set(1, 1, 1);
                mesh.visible = true;
                
                // Dispose of old material if it exists and is different from the new one
                if (mesh.material && mesh.material !== material && mesh.material.dispose) {
                    mesh.material.dispose();
                }
                mesh.material = material;
                return mesh;
            }
        }

        // Create new mesh (geometry will be set later)
        const mesh = new THREE.Mesh();
        mesh.material = material;
        return mesh;
    }

    // Return a mesh to the pool
    returnMesh(shapeName, mesh) {
        if (!mesh || this.disposedObjects.has(mesh)) return;

        // Remove from scene
        if (mesh.parent) {
            mesh.parent.remove(mesh);
        }

        // Clear material reference to prevent memory leaks
        // The material should be managed separately by MaterialManager
        mesh.material = null;

        // Add to pool
        if (!this.meshPool.has(shapeName)) {
            this.meshPool.set(shapeName, []);
        }

        const pool = this.meshPool.get(shapeName);
        if (pool.length < this.maxPoolSize) {
            pool.push(mesh);
        } else {
            // Dispose if pool is full
            this.disposeMesh(mesh);
        }
    }

    // Dispose of an object and mark it as disposed
    disposeMesh(mesh) {
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }
        if (mesh.material) {
            mesh.material.dispose();
        }
        this.disposedObjects.add(mesh);
    }

    // Dispose of a geometry and mark it as disposed
    disposeGeometry(geometry) {
        if (geometry) {
            geometry.dispose();
            this.disposedObjects.add(geometry);
        }
    }

    // Clear all pools
    clearPools() {
        // Dispose all geometries
        for (const [shapeName, geometries] of this.geometryPool) {
            geometries.forEach(geometry => {
                geometry.dispose();
            });
        }
        this.geometryPool.clear();

        // Dispose all meshes
        for (const [shapeName, meshes] of this.meshPool) {
            meshes.forEach(mesh => {
                this.disposeMesh(mesh);
            });
        }
        this.meshPool.clear();

        this.disposedObjects.clear();
    }

    // Get pool statistics
    getPoolStats() {
        let totalGeometries = 0;
        let totalMeshes = 0;

        for (const geometries of this.geometryPool.values()) {
            totalGeometries += geometries.length;
        }

        for (const meshes of this.meshPool.values()) {
            totalMeshes += meshes.length;
        }

        return {
            geometryPools: this.geometryPool.size,
            meshPools: this.meshPool.size,
            totalGeometries,
            totalMeshes,
            disposedObjects: this.disposedObjects.size
        };
    }
} 