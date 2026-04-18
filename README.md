<div align="center">
  
# 💥 BATTLE TANKS
**Infinite WebGL Combat Simulation**

<img src="public/screenshots/main_menu.png" alt="Main Menu" width="800" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"/>

[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black.svg?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Rapier](https://img.shields.io/badge/Physics-Rapier-red.svg?style=for-the-badge)](https://rapier.rs/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)

*An arcade-style, infinite-terrain tank shooter engineered for 60FPS browser performance.*

</div>

<br/>

<div align="center">
  <img src="public/screenshots/gameplay.png" alt="Gameplay" width="48%" style="border-radius: 8px; margin-right: 1%;"/>
  <img src="public/screenshots/combat.png" alt="Combat Closeup" width="48%" style="border-radius: 8px;"/>
</div>

<br/>

## ✨ Features that hit different

- 🌍 **Infinite Procedural Terrain:** Seamlessly expanding battlegrounds using an optimized 3x3 chunk grid system.
- 🎯 **Raycast Aiming Engine:** Decoupled Vector2 pointer tracking ensures flawlessly smooth 3D turret alignment, completely immune to HTML overlay lag.
- 💥 **Rapier Physics:** High-fidelity compound colliders (cuboid + ball belly) designed specifically for smooth, slope-climbing terrain traversal.
- 🤖 **Staggered AI:** An asymmetric AI director spawns and manages enemies using throttled evaluation strictly outside the render pipeline.
- 🚀 **Instanced Debris:** Explosions feature hundreds of rigid body debris fragments optimized via `InstancedMesh` for zero frame drops.

---

## 📂 Architecture

```text
Battle-Tanks/
├── public/                 # Compressed GLB assets (.wasm, models)
├── src/
│   ├── components/         # Core 3D Gameplay Elements
│   │   ├── Game.jsx              # Scene Setup & Lighting
│   │   ├── PlayerTank.jsx        # Player Physics, Aiming & Controls
│   │   ├── EnemyTank.jsx         # AI Behavior & Pathfinding
│   │   ├── Projectile.jsx        # Projectile Motion & Collision Layers
│   │   ├── Explosion.jsx         # Instanced Particle Effects
│   │   └── ...
│   ├── store/
│   │   └── gameStore.js    # Zustand: Lifecycle & Combat State
│   ├── ui/                 # 2D Screen Overlays (HUD, Menus)
│   ├── utils/              # Configuration & Constants
│   └── App.jsx             # React Tree Root
└── vite.config.js          # Build Configuration
```

---

## 🏎️ Under the Hood Hacks

You can't achieve AAA browser performance doing things the normal way. Here are the core optimizations that make this game hum:

1. **Memory-Leak Immune Re-Mounting:** Game Over screens trigger a new `gameSessionId`, actively unmounting the entire `<Canvas>` to instantly garbage collect detached geometry and Rapier manifolds without manual cleanup.
2. **Bitmask Collision Tiers:** Projectiles actively filter out the originating tank using Rapier's native Interaction Groups, preventing instantaneous self-destruction upon firing.
3. **Zero Garbage-Collection Thrash:** Global `THREE.Vector3` and `Math.atan2` logic are defined immutably *outside* the React functional scope and safely mutated per frame.
4. **Draco Compression:** Total 3D asset payload shrunk by ~70% allowing lightning-fast initial load times.

---

## 🎮 Play it locally

```bash
# 1. Grab everything
npm install

# 2. Spin it up
npm run dev
```

**Controls:**  
`W,A,S,D` to Drive | `Mouse` to Aim | `Left Click` to Fire

<div align="center">
<i>Built for the modern web.</i>
</div>
