
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';
// https://sbcode.net/threejs/physics-rapier-impulsejoint-motors/
// https://sbedit.net/embed/d00b6d21064f1313f556563cd471ccdbf7d7578f
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import RAPIER from '@dimforge/rapier3d-compat'
// import {Rapier, World, Mesh, Body} from 'ng-rapier-threejs';
import {Rapier, World, Mesh, Body, Light, LensFlare, LoaderRGBE, EventListener} from '../../../../projects/ng-rapier-threejs/src/public-api';


// collision groups
// floorShape = 0
// carShape = 1
// wheelShape = 2
// axelShape = 3
// the collision group calculations are,
// The floor collides with the wheels and car. membership=0, filter=[1,2] = 65542
// The car collides with the floor only. membership=1, filter=[0] = 131073
// The wheels collide with the floor only. membership=2, filter=[0] = 262145
// The axels collide with nothing. membership=3 = 589823

@Component({
selector: 'app-root',
templateUrl: './scene.html',
})
export class CarDriveComponent implements AfterViewInit {
  @ViewChild('domContainer', {static: true}) domContainer!: ElementRef;

  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  public world!:World
  public evListener: EventListener;
  public rapier!:Rapier;
  private stats!:Stats;

  public pivot = new THREE.Object3D()
  private yaw = new THREE.Object3D()
  private pitch = new THREE.Object3D()

  constructor(world: World, rapier: Rapier, evListener: EventListener) {
    this.world = world;
    this.rapier = rapier;
    this.evListener = evListener;
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
      .setCamera({fov:75, near: 0.1, far: 100, position: [0, 0, 4]})
      .setRenderer({antialias: true, test: false}, {toneMapping: 'ACESFilmic', shadowMap: {enable: true}})
      // .enableControls({damping: true, target:{x: 0, y: 1, z: 0}})
      .setGridHelper({args: [200, 100, 0x222222, 0x222222], position: {x: 0, y: -0.5, z: 0}})
      .update(); // requestAnimationFrame(this.update)
      
      const texture = await new LoaderRGBE().loader('assets/images/venice_sunset_1k.hdr', {mapping: 'EquirectangularReflectionMapping'})
      this.world.scene.environment = texture;
      this.world.scene.environmentIntensity = 0.1;
      
      await this.rapier.initRapier(0.0, -9.81, 0.0);
      this.rapier.enableRapierDebugRenderer();

      this.addRendererOption();


      this.evListener.activeClickEvent(this.world.renderer);
      this.evListener.activePointerlockchange(this.world.renderer);

      this.createFloorMesh();

      

      this.world.scene.add(this.pivot)


      this.pivot.add(this.yaw)
      this.yaw.add(this.pitch)
      this.pitch.add(this.world.camera) // adding the perspective camera to the hierarchy

      new Car(this, [0, 0, 0]);


      const boxes: Box[] = []
      for (let x = 0; x < 8; x += 1) {
        for (let y = 0; y < 8; y += 1) {
          boxes.push(new Box(this, [(x - 4) * 1.2, y + 1, -20]))
        }
      }
      
      this.evListener.addMouseMoveEvent({renderer: this.onDocumentMouseMove.bind(this)});
      this.evListener.addMouseWeelEvent({renderer: this.onDocumentMouseWheel.bind(this)});

      this.stats = new Stats()
      document.body.appendChild(this.stats.dom)
      
      const gui = new GUI()
      
      const physicsFolder = gui.addFolder('Physics')
      physicsFolder.add(this.rapier.world.gravity, 'x', -10.0, 10.0, 0.1)
      physicsFolder.add(this.rapier.world.gravity, 'y', -10.0, 10.0, 0.1)
      physicsFolder.add(this.rapier.world.gravity, 'z', -10.0, 10.0, 0.1)

  }

  private onDocumentMouseMove(e: MouseEvent) {
    this.yaw.rotation.y -= e.movementX * 0.002;
    const v = this.pitch.rotation.x - e.movementY * 0.002;
     // limit range
    if (v > -1 && v < 0.1) {
      this.pitch.rotation.x = v
    }
  }

  private onDocumentMouseWheel(e: WheelEvent) {
    e.preventDefault()
    const v = this.world.camera.position.z + e.deltaY * 0.005
    // limit range
    if (v >= 1 && v <= 10) {
      this.world.camera.position.z = v
    }
  }

  private async createFloorMesh() {
    const mesh = await this.world.addMesh({
      geometry: {type: 'box', args: [50, 1, 50]}, // geometry 속성
      material: {type: 'phong'}, // material 속성
      mesh: {receiveShadow: true}
    });

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type: 'fixed', translation: new THREE.Vector3(0, -1, 0)},
      collider: {shape: 'cuboid', args:[25, 0.5, 25], collisionGroups: [0, [1, 2]]},
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
  private game: CarDriveComponent;
  private translation:number[];


  private followTarget = new THREE.Object3D()
  private lightLeftTarget = new THREE.Object3D()
  private lightRightTarget = new THREE.Object3D()
  // private carBody?: RAPIER.RigidBody


  private wheelBLMotor!: RAPIER.ImpulseJoint
  private wheelBRMotor!: RAPIER.ImpulseJoint
  private wheelFLAxel!: RAPIER.ImpulseJoint
  private wheelFRAxel!: RAPIER.ImpulseJoint

  private v = new THREE.Vector3()
  // private keyMap!: { [key: string]: boolean }
  // private pivot!: THREE.Object3D

  constructor(game: any, translation:number[] = [0, 0, 0]) {
    this.game = game;
    this.translation = translation;
    

    this.followTarget.position.set(0, 1, 0);
    this.lightLeftTarget.position.set(-0.35, 1, -10);
    this.lightRightTarget.position.set(0.35, 1, -10);
    // this.pivot = pivot;

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

      carMesh.add(this.followTarget);
      const textureLoader = new THREE.TextureLoader()
      const textureFlare0 = textureLoader.load('/assets/images/lensflare0.png')
      const textureFlare3 = textureLoader.load('/assets/images/lensflare3.png')

      const lensflareLeft = new LensFlare()
      .addElement({texture: textureFlare0, size:1000, distance:0})
      .addElement({texture: textureFlare3, size:500, distance:0.2})
      .addElement({texture: textureFlare3, size:250, distance:0.8})
      .addElement({texture: textureFlare3, size:125, distance:0.6})
      .addElement({texture: textureFlare3, size:62.5, distance:0.4})
      .get();

      // const lensflareRight =  lensflareLeft.clone();

      const lensflareRight = new LensFlare()
      .addElement({texture: textureFlare0, size:1000, distance:0})
      .addElement({texture: textureFlare3, size:500, distance:0.2})
      .addElement({texture: textureFlare3, size:250, distance:0.8})
      .addElement({texture: textureFlare3, size:125, distance:0.6})
      .addElement({texture: textureFlare3, size:62.5, distance:0.4})
      .get();

      const headLightLeft = new Light({
        type: 'spot',
        position: [-0.4, 0.5, -1.01],
        angle: Math.PI / 4,
        penumbra: 0.5,
        intensity: 10,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      }).get();

      // const headLightRight = headLightLeft.clone()
      // headLightRight.position.set(0.4, 0.5, -1.01)

      const headLightRight = new Light({
        type: 'spot',
        position: [0.4, 0.5, -1.01],
        angle: Math.PI / 4,
        penumbra: 0.5,
        intensity: 10,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      }).get();

      // 이것이 제대로 작동안함
      carMesh.add(headLightLeft);
      (headLightLeft as THREE.SpotLight).target = this.lightLeftTarget
      headLightLeft.add(lensflareLeft)
      carMesh.add(this.lightLeftTarget)

      carMesh.add(headLightRight);
      (headLightRight as  THREE.SpotLight).target  = this.lightRightTarget
      headLightRight.add(lensflareRight)
      carMesh.add(this.lightRightTarget)

      const wheelBLMesh: any = gltf.getObjectByName('wheel_backLeft')
      const wheelBRMesh: any = gltf.getObjectByName('wheel_backRight')
      const wheelFLMesh: any = gltf.getObjectByName('wheel_frontLeft')
      const wheelFRMesh: any = gltf.getObjectByName('wheel_frontRight')

      this.game.world.scene.add(carMesh, wheelBLMesh,  wheelBRMesh, wheelFLMesh, wheelFRMesh);

      const position = new THREE.Vector3(this.translation[0], this.translation[1], this.translation[2]);
      const carBody: Body = new Body(this.game.rapier);
      carBody.create({ // convexHull trimmesh
        body : {type:'dynamic', translation: position.clone(), canSleep: false},
        collider: { shape: 'convexHull', restitution: 0.1, collisionGroups: [1, [0]]},
        object3d: carMesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
      });

      const wheelBLBody: Body = new Body(this.game.rapier);
      wheelBLBody.create({ // shape: 'cylinder',
        body : {type:'dynamic', translation: position.clone().add(new THREE.Vector3(-1, 1, 1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.05, friction: 2,
          translation: new THREE.Vector3(-0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2),
          collisionGroups: [2, [0]]
        },
        object3d: wheelBLMesh
      });

      const wheelBRBody: Body = new Body(this.game.rapier);
      wheelBRBody.create({ // shape: 'cylinder',
        body : {type:'dynamic', translation: position.clone().add(new THREE.Vector3(1, 1, 1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.05, friction: 2,
          translation: new THREE.Vector3(0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
          collisionGroups: [2, [0]]
        },
        object3d: wheelBRMesh
      });

      const wheelFLBody: Body = new Body(this.game.rapier);
      wheelFLBody.create({ // shape: 'cylinder',
        body : {type:'dynamic', translation: position.clone().add(new THREE.Vector3(-1, 1, -1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.05, friction: 2,
          translation: new THREE.Vector3(-0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
          collisionGroups: [2, [0]]
        },
        object3d: wheelFLMesh
      });

      const wheelFRBody: Body = new Body(this.game.rapier);
      wheelFRBody.create({
        body: {type:'dynamic', translation: position.clone().add(new THREE.Vector3(1, 1, -1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.05, friction: 2,
          translation: new THREE.Vector3(0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
          collisionGroups: [2, [0]]
        },
        
        object3d: wheelFRMesh
      });


      const axelFLBody: Body = new Body(this.game.rapier);
      axelFLBody.create({
        body: {type:'dynamic', translation: position.clone().add(new THREE.Vector3(-0.55, 0, -0.63)), canSleep: false},
        collider: {
          shape: 'cuboid', args: [0.1, 0.1, 0.1], mass: 1, 
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
          collisionGroups: [3]
        }
      });

      const axelFRBody: Body = new Body(this.game.rapier);
      axelFRBody.create({
        body: {type:'dynamic', translation: position.clone().add(new THREE.Vector3(0.55, 0, -0.63)), canSleep: false},
        collider: {
          shape: 'cuboid', args: [0.1, 0.1, 0.1], mass: 1, 
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
          collisionGroups: [3]
        }
      });

      this.wheelBLMotor = this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(-0.55, 0, 0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(-1, 0, 0)),
        carBody.rigidBody,
        wheelBLBody.rigidBody,
        true
      )

      this.wheelBRMotor = this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(0.55, 0, 0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(-1, 0, 0)),
        carBody.rigidBody,
        wheelBRBody.rigidBody,
        true
      )
    
      // attach steering axels to car. These will be configurable motors.
      this.wheelFLAxel = this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(-0.55, 0, -0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(0, 1, 0)),
        carBody.rigidBody,
        axelFLBody.rigidBody,
        true
      );
      (this.wheelFLAxel as RAPIER.PrismaticImpulseJoint).configureMotorModel(RAPIER.MotorModel.ForceBased)

      this.wheelFRAxel = this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(0.55, 0, -0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(0, 1, 0)),
        carBody.rigidBody,
        axelFRBody.rigidBody,
        true
      );
      (this.wheelFRAxel as RAPIER.PrismaticImpulseJoint).configureMotorModel(RAPIER.MotorModel.ForceBased)

      // attach front wheel to steering axels
      this.game.rapier.world.createImpulseJoint(RAPIER.JointData.revolute(new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(1, 0, 0)), axelFLBody.rigidBody, wheelFLBody.rigidBody, true)
      this.game.rapier.world.createImpulseJoint(RAPIER.JointData.revolute(new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(1, 0, 0)), axelFRBody.rigidBody, wheelFRBody.rigidBody, true)
    });

    this.game.world.updates.push((clock:any)=>{this.update(clock)});
  }

  private update(clock: THREE.Clock) {

    this.followTarget.getWorldPosition(this.v)
    // this.game.pivot.position.lerp(this.v, clock.getDelta() * 5) // frame rate independent
    this.game.pivot.position.copy(this.v)

    let targetVelocity = 0
    if (this.game.evListener.keyMap['KeyW'] || this.game.evListener.keyMap['ArrowUp']) {
      targetVelocity = 500
    }
    if (this.game.evListener.keyMap['KeyS'] || this.game.evListener.keyMap['ArrowDown']) {
      targetVelocity = -200
    }

    (this.wheelBLMotor as RAPIER.PrismaticImpulseJoint).configureMotorVelocity(targetVelocity, 2.0);
    (this.wheelBRMotor as RAPIER.PrismaticImpulseJoint).configureMotorVelocity(targetVelocity, 2.0);

    let targetSteer = 0
    if (this.game.evListener.keyMap['KeyA'] || this.game.evListener.keyMap['ArrowLeft']) {
      targetSteer += 0.6
    }
    if (this.game.evListener.keyMap['KeyD'] || this.game.evListener.keyMap['ArrowRight']) {
      targetSteer -= 0.6
    }
    (this.wheelFLAxel as RAPIER.PrismaticImpulseJoint).configureMotorPosition(targetSteer, 100, 10);
    (this.wheelFRAxel as RAPIER.PrismaticImpulseJoint).configureMotorPosition(targetSteer, 100, 10);

  }
}

class Box {
  private game: CarDriveComponent;
  private translation:number[];
  constructor(game: any, translation:number[] = [0, 0, 0]) {
    this.game = game;
    this.translation = translation;
    this.create();
  }

  private async create() {
    const box = await this.game.world.addMesh({
      geometry: {type: 'box'}, // geometry 속성
      material: {type: 'standard'}, // material 속성
      mesh: { castShadow: true}
    });

    // Rapier 생성
    const body: Body = new Body(this.game.rapier);
    await body.create({
      body: {type:'dynamic', translation:this.translation, canSleep: false},
      collider: {mass:0.1, restitution: 0.5},
      object3d: box // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }
}