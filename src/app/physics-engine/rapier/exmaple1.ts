// https://sbcode.net/threejs/physics-rapier/
import { Component,  AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import RAPIER from '@dimforge/rapier3d-compat';
// import {Rapier, World, Mesh, Body, EventListener} from '../../../../projects/ng-rapier-threejs/src/public-api';
import {Rapier, World, Mesh, Body, EventListener} from 'ng-rapier-threejs';
@Component({
selector: 'app-root',
templateUrl: './scene.html',
})

export class RapierSample1Component implements AfterViewInit { // , AfterViewInit
  @ViewChild('domContainer', {static: true}) domContainer!: ElementRef;

  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private world!:World;
  public evListener: EventListener;
  private rapier!:Rapier;
  private stats!:Stats;
  private cubeMesh!:THREE.Mesh;

  constructor(world: World, evListener: EventListener) {
    this.world = world;
    this.evListener = evListener;
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
      .setLights([{
        type: 'spot',
        position: [2.5, 5, 5],
        angle: Math.PI / 3,
        penumbra: 0.5,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      },{
        type: 'spot',
        intensity: Math.PI * 10,
        position: [-2.5, 5, 5],
        angle: Math.PI / 3,
        penumbra: 0.5,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      }])
      .enableRapier(async (rapier: Rapier) => {
        this.rapier = rapier;
        rapier.init([0.0, -9.81,  0.0]);
        // await rapier.initRapier(0.0, -9.81, 0.0);
        rapier.enableRapierDebugRenderer();
      })
      .enableControls({damping: true, target:{x: 0, y: 1, z: 0}})
      .setGridHelper({position: {x: 0, y: -75, z: 0}})
      .update(); // requestAnimationFrame(this.update)

    this.evListener.activeWindowResize();
    this.evListener.addWindowResize(this.world.onResize.bind(this.world));

    this.addRendererOption();

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
    await this.world.addObject({
      geometry: {type: 'box', args:[1, 1, 1]}, // geometry 속성
      material: {type: 'normal'}, // material 속성
      mesh: { castShadow: true},
      rapier: {
        body: {type: 'dynamic', translation:new THREE.Vector3(0, 5, 0), canSleep: false, userData: {name: 'box'}},
        collider: {mass:1, restitution: 0.1},
      }
    });
  }

  private async createFloorMesh() {

    const mesh = new Mesh();
    const floorMesh = await mesh.create({
      geometry: {type: 'box', args: [50, 1, 50]}, // geometry 속성
      material: {type: 'phong'}, // material 속성
      mesh: { //  mesh 속성
        receiveShadow: true,
        // receiveShadow: true
      }
    });

    this.world.scene.add(floorMesh);

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type: 'fixed', canSleep: false, userData: {name: 'floor'}},
      collider: {mass:1, restitution: 1.1},
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
          b.object3d === intersects[0].object && b.rigidBody.applyImpulse(new RAPIER.Vector3(0, 10, 0), true)
        })
      }
    })
  }
}