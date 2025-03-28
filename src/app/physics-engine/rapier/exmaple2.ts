
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import RAPIER from '@dimforge/rapier3d-compat'
import {Rapier, World, Mesh, Body} from 'ng-rapier-threejs';
@Component({
selector: 'app-root',
templateUrl: './scene.html',
})
export class RapierSample2Component implements AfterViewInit {
  @ViewChild('domContainer', {static: true}) domContainer!: ElementRef;

  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  public world!:World
  public rapier!:Rapier;
  private stats!:Stats;

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
    }, 10)
  }

  private async init() {
    this.world.clear()
      .setContainer(this.domContainer.nativeElement)
      .setScreen()
      .setCamera({fov:95, near: 0.1, far: 100, position: [0, 2, 5]})
      .setRenderer({antialias: true})
      .setLights({
        type: 'spot',
        intensity: Math.PI * 10,
        angle: Math.PI / 1.8,
        penumbra: 0.5,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      }).setLights({
        type: 'spot',
        intensity: Math.PI * 10,
        position: [-2.5, 5, 5],
        angle: Math.PI / 1.8,
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


      this.createFloorMesh();

      this.createCubeMesh();
      this.createSphereMesh();
      this.createCylinderMesh();
      this.createIcosahedronMesh(); 
      this.createTorusKnotMesh();
      this.createOBJLoader();

      new Car(this, [0, 2, 0])
      this.stats = new Stats()
      document.body.appendChild(this.stats.dom)
      
      const gui = new GUI()
      
      const physicsFolder = gui.addFolder('Physics')
      physicsFolder.add(this.rapier.world.gravity, 'x', -10.0, 10.0, 0.1)
      physicsFolder.add(this.rapier.world.gravity, 'y', -10.0, 10.0, 0.1)
      physicsFolder.add(this.rapier.world.gravity, 'z', -10.0, 10.0, 0.1)

  }

  private async createFloorMesh() {
  
    const mesh = await new Mesh().create({
      geometry: {type: 'box', args: [50, 1, 50]}, // geometry 속성
      material: {type: 'phong'}, // material 속성
      mesh: {receiveShadow: true}
    });

    this.world.scene.add(mesh);

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type: 'fixed', translation: new THREE.Vector3(0, -1, 0)},
      collider: {shape: 'cuboid', args:[25, 0.5, 25]},
      object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }

  private async createCubeMesh() {
  
    const mesh = await new Mesh().create({
      geometry: {type: 'box', args: [1, 1, 1]}, // geometry 속성
      material: {type: 'normal'}, // material 속성
      mesh: { castShadow: true}
    });
    this.world.scene.add(mesh);

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type:'dynamic', translation:new THREE.Vector3(0, 5, 0), canSleep: false},
      collider: {mass:1, restitution: 0.5},
      object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }

  private async createSphereMesh() {
  
    const mesh = await new Mesh().create({
      geometry: {type: 'sphere'}, // geometry 속성
      material: {type: 'normal'}, // material 속성
      mesh: {receiveShadow: true}
    });

    this.world.scene.add(mesh);

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type:'dynamic', translation: new THREE.Vector3(-2.5, 5, 0), canSleep: false},
      collider: {shape: 'ball', restitution: 0.5},
      object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }

  private async createCylinderMesh() {
    const mesh = await new Mesh().create({
      geometry: {type: 'cylinder', args: [1, 1, 2, 16]}, // geometry 속성
      material: {type: 'normal'}, // material 속성
      mesh: {castShadow: true}
    });

    this.world.scene.add(mesh);

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type:'dynamic', translation: new THREE.Vector3(0, 5, 0), canSleep: false},
      collider: {shape: 'cylinder', mass:1, restitution: 0.5},
      object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }

  private async createIcosahedronMesh() {
      
    const mesh = await new Mesh().create({
      geometry: {type: 'icosahedron', args: [1, 0]}, // geometry 속성
      material: {type: 'normal'}, // material 속성
      mesh: {receiveShadow: true}
    });

    this.world.scene.add(mesh);

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type:'dynamic', translation:new THREE.Vector3(2.5, 5, 0), canSleep: false},
      collider: {shape: 'convexHull', mass:1, restitution: 0.5},
      object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }

  private async createTorusKnotMesh() {
        
    const mesh = await new Mesh().create({
      geometry: {type: 'torusknot'}, // geometry 속성
      material: {type: 'normal'}, // material 속성
      mesh: {receiveShadow: true}
    });

    this.world.scene.add(mesh);

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type:'dynamic', translation:new THREE.Vector3(5, 5, 0)},
      collider: {shape: 'trimesh', mass:1, restitution: 0.5},
      object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }

  private async createOBJLoader() {
    const mesh = await new Mesh().loadObj({
      material: {type: 'normal'}, // material 속성
      mesh: {castShadow: true, url: '/assets/suzanne.obj', name: 'Suzanne'}
    });

    this.world.scene.add(mesh);

    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type:'dynamic', translation:new THREE.Vector3(-1, 10, 0)},
      collider: {shape: 'trimesh', mass:1, restitution: 0.5},
      object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }

  private addRendererOption() {
      // this.renderer = new THREE.WebGLRenderer({antialias: true}); // renderer with transparent backdrop
      this.world.renderer.setSize(window.innerWidth, window.innerHeight)
      this.world.renderer.shadowMap.enabled = true
      this.world.renderer.shadowMap.type = THREE.VSMShadowMap
  
      this.world.renderer.domElement.addEventListener('click', (e) => {
  
        this.mouse.set(
          (e.clientX / this.world.renderer.domElement.clientWidth) * 2 - 1,
          -(e.clientY / this.world.renderer.domElement.clientHeight) * 2 + 1
        )
        this.raycaster.setFromCamera(this.mouse, this.world.camera)
        const intersects = this.raycaster.intersectObjects(
          this.rapier.dynamicBodies.flatMap((a) => a.object3d), // , sphereMesh, cylinderMesh, icosahedronMesh, torusKnotMesh
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

class Car {
  dynamicBodies: any = []
  private game: RapierSample2Component;
  private translation:number[];
  constructor(game: any, translation:number[] = [0, 0, 0]) {
    this.game = game;
    this.translation = translation;
    this.create();

  }

  private async create(){
    
    await new Mesh().loadGLTF({
      url: '/assets/sedanSports.glb',
    }, (gltf:any)=>{
      const carMesh:any = gltf.getObjectByName('body');
      carMesh.position.set(0, 0, 0)
      carMesh.traverse((o: any) => {
        if(o.type === 'Mesh' ) {
          o.castShadow = true;
        }
      })
  
      const wheelBLMesh: any = gltf.getObjectByName('wheel_backLeft')
      const wheelBRMesh: any = gltf.getObjectByName('wheel_backRight')
      const wheelFLMesh: any = gltf.getObjectByName('wheel_frontLeft')
      const wheelFRMesh: any = gltf.getObjectByName('wheel_frontRight')

      this.game.world.scene.add(carMesh, wheelBLMesh,  wheelBRMesh, wheelFLMesh, wheelFRMesh);

      const position = new THREE.Vector3(this.translation[0], this.translation[1], this.translation[2]);
      const carBody: Body = new Body(this.game.rapier);
      carBody.create({ // convexHull trimmesh
        body : {type:'dynamic', translation: position.clone(), canSleep: false},
        collider: { shape: 'convexHull', restitution: 0.5},
        object3d: carMesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
      });

      const wheelBLBody: Body = new Body(this.game.rapier);
      wheelBLBody.create({ // shape: 'cylinder',
        body : {type:'dynamic', translation: position.clone().add(new THREE.Vector3(-1, 1, 1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.5,
          //  translation: position.clone().add(new THREE.Vector3(-1, 1, 1)),
          translation: new THREE.Vector3(-0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2)
        },
        object3d: wheelBLMesh
      });

      const wheelBRBody: Body = new Body(this.game.rapier);
      wheelBRBody.create({ // shape: 'cylinder',
        body : {type:'dynamic', translation: position.clone().add(new THREE.Vector3(1, 1, 1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.5,
          translation: new THREE.Vector3(0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
        },
        object3d: wheelBRMesh
      });

      const wheelFLBody: Body = new Body(this.game.rapier);
      wheelFLBody.create({ // shape: 'cylinder',
        body : {type:'dynamic', translation: position.clone().add(new THREE.Vector3(-1, 1, -1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.5,
          translation: new THREE.Vector3(-0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
        },
        object3d: wheelFLMesh
      });

      const wheelFRBody: Body = new Body(this.game.rapier);
      wheelFRBody.create({
        body: {type:'dynamic', translation: position.clone().add(new THREE.Vector3(1, 1, -1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.5,
          translation: new THREE.Vector3(0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
        },
        
        object3d: wheelFRMesh
      });

      this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(-0.55, 0, 0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(-1, 0, 0)),
        carBody.rigidBody,
        wheelBLBody.rigidBody,
        true
      )

      this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(0.55, 0, 0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(1, 0, 0)),
        carBody.rigidBody,
        wheelBRBody.rigidBody,
        true
      )

      this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(-0.55, 0, -0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(-1, 0, 0)),
        carBody.rigidBody,
        wheelFLBody.rigidBody,
        true
      )

      this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(0.55, 0, -0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(1, 0, 0)),
        carBody.rigidBody,
        wheelFRBody.rigidBody,
        true
      )
    });

  }
}