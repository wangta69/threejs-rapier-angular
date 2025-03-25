// https://sbcode.net/threejs/physics-rapier/
import { Component,  AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import RAPIER from '@dimforge/rapier3d-compat';
import {Rapier, World, Mesh, Body} from '../../../projects/ng-rapier-threejs/src/public-api';

@Component({
selector: 'app-root',
templateUrl: './scene.html',
})

export class RapierSample1Component implements AfterViewInit { // , AfterViewInit
  @ViewChild('domContainer', {static: true}) domContainer!: ElementRef;

  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private world!:World;
  private rapier!:Rapier;
  private stats!:Stats;
  private cubeMesh!:THREE.Mesh;

  constructor(world: World, rapier: Rapier) {
    this.world = world;
    this.rapier = rapier;
  }

  ngAfterViewInit() {
    let interval = setInterval(() => {
      const domContainer = this.domContainer.nativeElement.offsetHeight;
      if (domContainer) {
        clearInterval(interval);
        this.init();
      }
    }, 1000)
  }

  private async init() {

    this.world.clear()
      .setContainer(this.domContainer.nativeElement)
      .setScreen()
      .setCamera({fov:95, near: 0.1, far: 100, position: [0, 2, 5]})
      // .setCamera({fov:95, near: 0.1, far: 100})
      .setRenderer({antialias: true})
      .setLights({
        type: 'spot',
        position: [2.5, 5, 5],
        angle: Math.PI / 3,
        penumbra: 0.5,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      }).setLights({
        type: 'spot',
        intensity: Math.PI * 10,
        position: [-2.5, 5, 5],
        angle: Math.PI / 3,
        penumbra: 0.5,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      })
      .enableControls({damping: true, target:{x: 0, y: 1, z: 0}})
      .enableHelpers({position: {x: 0, y: -75, z: 0}})
      .update(); // requestAnimationFrame(this.update)

    await this.rapier.initRapier(0.0, -9.81, 0.0);
    this.rapier.enableRapierDebugRenderer();

    this.addRendererOption();

    // this.world.camera.position.set(0, 2, 5);

    this.createCubeMesh();
    this.createFloorMesh();

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)
    
    const gui = new GUI()
    
    const physicsFolder = gui.addFolder('Physics')
    physicsFolder.add(this.rapier.world.gravity, 'x', -10.0, 10.0, 0.1)
    physicsFolder.add(this.rapier.world.gravity, 'y', -10.0, 10.0, 0.1)
    physicsFolder.add(this.rapier.world.gravity, 'z', -10.0, 10.0, 0.1)
  }

  private async createCubeMesh() {

    const mesh = new Mesh();
    this.cubeMesh = await mesh.create({
      geometry: {type: 'box', width: 1, height: 1, depth: 1}, // geometry 속성
      material: {type: 'normal'}, // material 속성
      mesh: { //  mesh 속성
        position:new THREE.Vector3(0, 5, 0),
        castShadow: true,
      }
    });
    this.world.scene.add(this.cubeMesh);

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      collider: {
        type:'dynamic',
        mass:1, restitution: 0.1,
        userData: {name: 'obstacle'},
        canSleep: false,
      },
      object3d: this.cubeMesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }

  private async createFloorMesh() {

    const mesh = new Mesh();
    const floorMesh = await mesh.create({
      geometry: {type: 'box', width: 100, height: 1, depth: 100}, // geometry 속성
      material: {type: 'phong'}, // material 속성
      mesh: { //  mesh 속성
        receiveShadow: true,
        // receiveShadow: true
        position: new THREE.Vector3(0, -1, 0),
      }
    });

    this.world.scene.add(floorMesh);

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      collider: {
        type:'fixed',
        mass:1, restitution: 1.1,
        userData: {name: 'obstacle'},
        canSleep: false,
        translation: [0, -1, 0]
      },
      object3d: floorMesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }

  private addRendererOption() {
    // this.renderer = new THREE.WebGLRenderer({antialias: true}); // renderer with transparent backdrop
    this.world.renderer.setSize(window.innerWidth, window.innerHeight)
    this.world.renderer.shadowMap.enabled = true
    this.world.renderer.shadowMap.type = THREE.VSMShadowMap
    // this.domContainer.nativeElement.appendChild(this.world.renderer.domElement);

    this.world.renderer.domElement.addEventListener('click', (e) => {

      this.mouse.set(
        (e.clientX / this.world.renderer.domElement.clientWidth) * 2 - 1,
        -(e.clientY / this.world.renderer.domElement.clientHeight) * 2 + 1
      )
      this.raycaster.setFromCamera(this.mouse, this.world.camera)
      const intersects = this.raycaster.intersectObjects(
        [this.cubeMesh], // , sphereMesh, cylinderMesh, icosahedronMesh, torusKnotMesh
        false
      )
      if (intersects.length) {
        this.rapier.dynamicBodies.forEach((b) => {
          console.log('b:', b);
          b.object3d === intersects[0].object && b.rigidBody.applyImpulse(new RAPIER.Vector3(0, 10, 0), true)
        })
      }
    })
  }
}