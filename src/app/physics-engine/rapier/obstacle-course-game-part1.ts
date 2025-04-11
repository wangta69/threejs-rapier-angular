
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';
// https://sbedit.net/efeae5eb0f8224231f28c0a74916a24ced87b788

import Stats from 'three/addons/libs/stats.module.js'

import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import RAPIER from '@dimforge/rapier3d-compat'
import {Rapier, World, Body, Light, LensFlare, LoaderRGBE, EventListener, ClockProps} from '../../../../projects/ng-rapier-threejs/src/public-api';
import {_vector3, _euler, _quaternion, _object3d, _matrix4} from '../../../../projects/ng-rapier-threejs/src/public-api';
type TanimationAction = {
  idle: THREE.AnimationAction,
  jump: THREE.AnimationAction,
  pose: THREE.AnimationAction,
  walk: THREE.AnimationAction,
  run: THREE.AnimationAction
}

@Component({
selector: 'app-root',
templateUrl: './scene.html',
})
export class ObstacleCourseGamePart1 implements AfterViewInit {
  @ViewChild('domContainer', {static: true}) domContainer!: ElementRef;

  public world!:World
  public evListener: EventListener;
  public rapier!:Rapier;
  public pivot = new THREE.Object3D();
  public light!: THREE.DirectionalLight;

  private player!:Player;

  constructor(world: World, evListener: EventListener) { //rapier: Rapier, 
    this.world = world;
    // this.rapier = rapier;
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
      .setRenderer({antialias: true}, {toneMapping: 'ACESFilmic', shadowMap: {enabled: true}})
      // .enableControls({damping: true, target:{x: 0, y: 1, z: 0}})
      .setGridHelper({args: [50, 50]})
      .setLight(
        {
        type: 'directional',
        color: 0xffffff,
        intensity: Math.PI,
        position: [65.7, 19.2, 50.2],
        castShadow : true,
        // shadow: {blurSamples: 10, radius: 5}
      }, (Light:Light) => {

        const textureLoader = new THREE.TextureLoader()
        const textureFlare0 = textureLoader.load('/assets/images/lensflare0.png')
        const textureFlare3 = textureLoader.load('/assets/images/lensflare3.png')
    
        const lensflare = new LensFlare()
          .addElement({texture: textureFlare0, size:1000, distance:0})
          .addElement({texture: textureFlare3, size:500, distance:0.2})
          .addElement({texture: textureFlare3, size:250, distance:0.8})
          .addElement({texture: textureFlare3, size:125, distance:0.6})
          .addElement({texture: textureFlare3, size:62.5, distance:0.4})
          .get();

        this.light = (Light.light as THREE.DirectionalLight);
        this.light.add(lensflare);
        // (Light.light as THREE.DirectionalLight).target = this.player.followTarget;
      })
      .enableRapier(async (rapier: Rapier) => {
        this.rapier = rapier;
        rapier.init([0.0, -9.81,  0.0]);
        // await rapier.initRapier(0.0, -9.81, 0.0);
        rapier.enableRapierDebugRenderer();
      })
      .update(); // requestAnimationFrame(this.update)
    
      this.evListener.activeWindowResize();
      this.evListener.addWindowResize(this.world.onResize.bind(this.world));


      this.floormesh();

      this.player = new Player(this)
      await this.player.init();

      const texture = await new LoaderRGBE().loader('assets/images/venice_sunset_1k.hdr', {mapping: 'EquirectangularReflectionMapping'})
      this.world.scene.environment = texture;
      this.world.scene.background = texture;
      this.world.scene.backgroundBlurriness =  0.4;

      this.evListener.activeClickEvent(this.world.renderer);
      this.evListener.activePointerlockchange(this.world.renderer);
  }

  private async floormesh() {
    await this.world.addObject({
      geometry: {type: 'box', args: [50, 1, 50]}, // geometry 속성
      material: {type: 'standard'}, // material 속성
      mesh: {receiveShadow : true}, // , position:[0, -0.5, 0]
      rapier: {
        body: {type: 'fixed', translation: new THREE.Vector3(0, -1, 0)},
        collier: {shape: 'cuboid', args:[25, 0.5, 25]},
      }
    });
  }
}

class AnimationController {
  private scene: THREE.Scene;
  private wait = false;
  private animationActions: TanimationAction = {} as TanimationAction;
  private activeAction: any;
  public speed = 0;
  private evListener: EventListener;
  public model!: Eve;

  constructor(scene: THREE.Scene, evListener: EventListener) {
      this.scene = scene
      this.evListener = evListener
  }

  async init() {
      this.model = new Eve();
      await this.model.init(this.animationActions);
      this.activeAction = this.animationActions['idle'];
      this.scene.add(this.model)
  }

  setAction(action: THREE.AnimationAction) {
    if (this.activeAction != action) {

      this.activeAction.fadeOut(0.1);
      action.reset().fadeIn(0.1).play();

      this.activeAction = action

      switch (action) {
        case this.animationActions['walk']:
          // this.speed = 5.25;
          this.speed = 0.5;
          break
        case this.animationActions['run']:
        case this.animationActions['jump']:
          // this.speed = 16;
          this.speed = 1.6;
          break
        case this.animationActions['pose']:
        case this.animationActions['idle']:
          this.speed = 0;
          break
      }
    }

    // this.speed = 0; // for test
  }

  update(delta: number) {

    if (!this.wait) {
      let actionAssigned = false

      if (this.evListener.keyMap['Space']) {
        this.setAction(this.animationActions['jump'])
        actionAssigned = true
        this.wait = true // blocks further actions until jump is finished
        setTimeout(() => (this.wait = false), 1200)
      }

      if (
        !actionAssigned &&
        (this.evListener.keyMap['KeyW'] || this.evListener.keyMap['KeyA'] || this.evListener.keyMap['KeyS'] || this.evListener.keyMap['KeyD']) &&
        this.evListener.keyMap['ShiftLeft']
      ) {
        this.setAction(this.animationActions['run'])
        actionAssigned = true
      }

      if (
        !actionAssigned &&
        (this.evListener.keyMap['KeyW'] || this.evListener.keyMap['KeyA'] || this.evListener.keyMap['KeyS'] || this.evListener.keyMap['KeyD'])
      ) {
        this.setAction(this.animationActions['walk'])
        actionAssigned = true
      }

      if (!actionAssigned && this.evListener.keyMap['KeyQ']) {
        this.setAction(this.animationActions['pose'])
        actionAssigned = true
      }

      !actionAssigned && this.setAction(this.animationActions['idle'])
    }

    // update the Eve models animation mixer
    this.model.update(delta)
   
  }
}


class Eve extends THREE.Group {
  private mixer!: THREE.AnimationMixer;
  private glTFLoader!: GLTFLoader;

  constructor() {
      super()

      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/jsm/libs/draco/') // move draco from node_modules/three/examples/jsmm/libs/draco to public/jsm/libs/draco

      this.glTFLoader = new GLTFLoader()
      this.glTFLoader.setDRACOLoader(dracoLoader)
  }

  async init(animationActions: TanimationAction) {
    const [eve, idle, run, jump, pose] = await Promise.all([
      this.glTFLoader.loadAsync('/assets/models/eve$@walk_compressed.glb'),
      this.glTFLoader.loadAsync('/assets/models/eve@idle.glb'),
      this.glTFLoader.loadAsync('/assets/models/eve@run.glb'),
      this.glTFLoader.loadAsync('/assets/models/eve@jump.glb'),
      this.glTFLoader.loadAsync('/assets/models/eve@pose.glb')
    ])
    eve.scene.traverse((m: any) => {
      if (m.isMesh) {
        m.castShadow = true;
      }
    })

    this.mixer = new THREE.AnimationMixer(eve.scene)
    animationActions['idle'] = this.mixer.clipAction(idle.animations[0])
    animationActions['jump'] = this.mixer.clipAction(jump.animations[0])
    animationActions['pose'] = this.mixer.clipAction(pose.animations[0])
    animationActions['walk'] = this.mixer.clipAction(THREE.AnimationUtils.subclip(eve.animations[0], 'walk', 0, 42))
    animationActions['run'] = this.mixer.clipAction(THREE.AnimationUtils.subclip(run.animations[0], 'run', 0, 17))

    animationActions['idle'].play();

    this.add(eve.scene)
  }

  update(delta: number) {
    this.mixer.update(delta)
  }
}

class FollowCam {
  private camera
  private pivot = new THREE.Object3D()
  private yaw = new THREE.Object3D()
  private pitch = new THREE.Object3D()

  constructor(game: ObstacleCourseGamePart1) {
      this.camera = game.world.camera;

      this.yaw.position.y = 0.75

      document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === game.world.renderer.domElement) {
          game.world.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove)
          game.world.renderer.domElement.addEventListener('wheel', this.onDocumentMouseWheel)
        } else {
          game.world.renderer.domElement.removeEventListener('mousemove', this.onDocumentMouseMove)
          game.world.renderer.domElement.removeEventListener('wheel', this.onDocumentMouseWheel)
        }
      })

      game.world.scene.add(this.pivot)
      this.pivot.add(this.yaw)
      this.yaw.add(this.pitch)
      this.pitch.add(game.world.camera) // adding the perspective camera to the hierarchy
  }

  onDocumentMouseMove = (e: MouseEvent) => {
      this.yaw.rotation.y -= e.movementX * 0.002
      const v = this.pitch.rotation.x - e.movementY * 0.002

      // limit range
      if (v > -1 && v < 1) {
          this.pitch.rotation.x = v
      }
  }

  onDocumentMouseWheel = (e: WheelEvent) => {
      e.preventDefault()
      const v = this.camera.position.z + e.deltaY * 0.005

      // limit range
      if (v >= 0.5 && v <= 10) {
          this.camera.position.z = v
      }
  }
}



class Player {

  private game: ObstacleCourseGamePart1;
  // private scene: any;
  // private world: any;
  private body!: RAPIER.RigidBody;
  private animationController!: AnimationController;
  private vector = _vector3.clone();
  private inputVelocity = _vector3.clone();
  private euler = _euler.clone();
  private quaternion = _quaternion.clone();
  public  followTarget = _object3d.clone(); //new Mesh(new SphereGeometry(0.1), new MeshNormalMaterial())
  private grounded = true
  private rotationMatrix = _matrix4.clone();
  private  targetQuaternion = _quaternion.clone();
  private followCam: any;
  // private keyboard: any;
  private wait = false;

  // constructor(scene:THREE.Scene, camera: THREE.Camera, renderer:THREE.WebGLRenderer, world:any, position = [0, 0, 0]) {
  constructor(game: ObstacleCourseGamePart1) {
    this.game = game;
    // this.scene = game.world.scene;
    // this.world = game.world;
    this.followCam = new FollowCam(game)
    this.game.light.target = this.followTarget;
    this.game.world.scene.add(this.followTarget) // the followCam will lerp towards this object3Ds world position.

    this.create();
  }

  private async create() {

    await this.game.world.addRapierBody({
      body: {
        type:'dynamic', translation:[0, 0, 0], linearDamping: 4, 
        enabledRotations: [false, false, false], canSleep: false
      },
      collider: {
        shape: 'capsule', args: [0.5, 0.15], translation: [0, 0.645, 0], 
        mass:0.1, friction: 0, restitution: 0.5,
        onCollisionEnter: () =>{ // activeEvents: 'COLLISION_EVENTS',
          this.setGrounded();
        }
      }
    }, (body: RAPIER.RigidBody) =>{
      this.body = body;
    })
  }

  async init() {
    this.animationController = new AnimationController(this.game.world.scene, this.game.evListener)
    await this.animationController.init()
    this.game.world.updates.push((clock:ClockProps)=>{this.update(clock)});
  }

  private setGrounded() {
    this.body.setLinearDamping(4)
    this.grounded = true
    setTimeout(() => (this.wait = false), 250)
  }

  update(clock: ClockProps) {
    this.inputVelocity.set(0, 0, 0);
    if (this.grounded) {
      if (this.game.evListener.keyMap['KeyW']) {
        this.inputVelocity.z = -1
      }
      if (this.game.evListener.keyMap['KeyS']) {
        this.inputVelocity.z = 1
      }
      if (this.game.evListener.keyMap['KeyA']) {
        this.inputVelocity.x = -1
      }
      if (this.game.evListener.keyMap['KeyD']) {
        this.inputVelocity.x = 1
      }

      this.inputVelocity.setLength(clock.delta * (this.animationController.speed || 1)) // limit horizontal movement based on walking or running speed
      if (!this.wait && this.game.evListener.keyMap['Space']) {
        this.wait = true
        this.body.setLinearDamping(0)
        if (this.game.evListener.keyMap['ShiftLeft']) {
          this.inputVelocity.multiplyScalar(15)
        } else {
          this.inputVelocity.multiplyScalar(10)
        }
        this.inputVelocity.y = 0.5 // give jumping some height
        this.grounded = false
      }
    }

    // // apply the followCam yaw to inputVelocity so the capsule moves forward based on cameras forward direction
    this.euler.y = this.followCam.yaw.rotation.y
    this.quaternion.setFromEuler(this.euler)
    this.inputVelocity.applyQuaternion(this.quaternion)

    // now move the capsule body based on inputVelocity
    this.body.applyImpulse(this.inputVelocity, true)

    this.followTarget.position.copy(this.body.translation()) // Copy the capsules position to followTarget
    this.followTarget.getWorldPosition(this.vector) // Put followTargets new world position into a vector
    this.followCam.pivot.position.lerp(this.vector, clock.delta * 10) // lerp the followCam pivot towards the vector

    // // Eve model also lerps towards the capsules position, but independently of the followCam
    this.animationController.model.position.lerp(this.vector, clock.delta * 20)

    // // Also turn Eve to face the direction of travel.
    // // First, construct a rotation matrix based on the direction from the followTarget to Eve
    this.rotationMatrix.lookAt(this.followTarget.position, this.animationController.model.position, this.animationController.model.up)
    this.targetQuaternion.setFromRotationMatrix(this.rotationMatrix) // creating a quaternion to rotate Eve, since eulers can suffer from gimbal lock

    // // Next, get the distance from the Eve model to the followTarget
    const distance = this.animationController.model.position.distanceTo(this.followTarget.position)

    // // If distance is higher than some espilon, and Eves quaternion isn't the same as the targetQuaternion, then rotate towards the targetQuaternion.
    if (distance > 0.0001 && !this.animationController.model.quaternion.equals(this.targetQuaternion)) {
      this.targetQuaternion.z = 0 // so that it rotates around the Y axis
      this.targetQuaternion.x = 0 // so that it rotates around the Y axis
      this.targetQuaternion.normalize() // always normalise quaternions before use.
      this.animationController.model.quaternion.rotateTowards(this.targetQuaternion, clock.delta * 20)
    }

    // update which animationAction Eve should be playing
    this.animationController.update(clock.delta)
   
  }
}

