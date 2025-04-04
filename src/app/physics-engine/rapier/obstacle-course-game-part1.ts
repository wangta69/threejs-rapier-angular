
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';
// https://sbedit.net/efeae5eb0f8224231f28c0a74916a24ced87b788

import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'




import RAPIER, { ActiveEvents, ColliderDesc, RigidBody, RigidBodyDesc, World as RapierWorld, EventQueue } from '@dimforge/rapier3d-compat'
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js'
// import { HDRJPGLoader } from '@monogrid/gainmap-js'

// import {Rapier, World, Mesh, Body} from 'ng-rapier-threejs';
import {Rapier, World, Mesh, Body, Light, LensFlare, LoaderRGBE, EventListener, ClockProps} from '../../../../projects/ng-rapier-threejs/src/public-api';
import { catchError } from 'rxjs';


@Component({
selector: 'app-root',
templateUrl: './scene.html',
})
export class ObstacleCourseGamePart1 implements AfterViewInit {
  @ViewChild('domContainer', {static: true}) domContainer!: ElementRef;

  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  public world!:World
  public evListener: EventListener;
  public rapier!:Rapier;
  private stats!:Stats;

  public pivot = new THREE.Object3D();
  private yaw = new THREE.Object3D();
  private pitch = new THREE.Object3D();
  public light!: THREE.DirectionalLight;

  private player!:Player;

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

    this.world.clear()
      .setContainer(this.domContainer.nativeElement)
      .setScreen()
      .setCamera({fov:75, near: 0.1, far: 100, position: [0, 0, 4]})
      .setRenderer({antialias: true}, {toneMapping: 'ACESFilmic', shadowMap: {enable: true}})
      // .enableControls({damping: true, target:{x: 0, y: 1, z: 0}})
      .setGridHelper({args: [50, 50]})
      .setLight(
        {
        type: 'directional',
        color: 0xffffff,
        intensity: Math.PI,
        position: [65.7, 19.2, 50.2],
        // angle: Math.PI / 1.8,
        // penumbra: 0.5,
        castShadow: true,
        // shadow: {blurSamples: 10, radius: 5}
      }, (Light:Light) => {
        this.light = (Light.light as THREE.DirectionalLight);
        this.light.add(lensflare);
        // (Light.light as THREE.DirectionalLight).target = this.player.followTarget;
      })
      .update(); // requestAnimationFrame(this.update)
      
      this.evListener.activeWindowResize();
      this.evListener.addWindowResize(this.world.onResize.bind(this.world));

      await this.rapier.initRapier(0.0, -9.81, 0.0);
      this.rapier.enableRapierDebugRenderer();

      this.floormesh();

      this.player = new Player(this, [0, 0.1, 0])
      await this.player.init();

      /*
      const environment = new Environment(this.scene)
      await environment.init()
      environment.light.target = this.player.followTarget

      const ui = new UI(this.renderer)
      ui.show()
      */
     

      


      const texture = await new LoaderRGBE().loader('assets/images/venice_sunset_1k.hdr', {mapping: 'EquirectangularReflectionMapping'})
      this.world.scene.environment = texture;
      this.world.scene.background = texture;
      this.world.scene.backgroundBlurriness =  0.4;
      /*
      await new HDRJPGLoader(renderer).loadAsync('/img/venice_sunset_1k.hdr.jpg').then((texture) => {
                        texture.renderTarget.texture.mapping = EquirectangularReflectionMapping
                        this.scene.environment = texture.renderTarget.texture
                        this.scene.background = texture.renderTarget.texture
                        this.scene.backgroundBlurriness = 0.4
                    })
                        */



       /*


*/

      this.evListener.activeClickEvent(this.world.renderer);
      this.evListener.activePointerlockchange(this.world.renderer);

  /*    

      

      this.world.scene.add(this.pivot)


      this.pivot.add(this.yaw)
      this.yaw.add(this.pitch)
      this.pitch.add(this.world.camera) // adding the perspective camera to the hierarchy

      // new Car(this, [0, 0, 0]);

      

      
      this.evListener.addMouseMoveEvent({renderer: this.onDocumentMouseMove.bind(this)});
      this.evListener.addMouseWeelEvent({renderer: this.onDocumentMouseWheel.bind(this)});

      this.stats = new Stats()
      document.body.appendChild(this.stats.dom)
      
      const gui = new GUI()
      
      const physicsFolder = gui.addFolder('Physics')
      physicsFolder.add(this.rapier.world.gravity, 'x', -10.0, 10.0, 0.1)
      physicsFolder.add(this.rapier.world.gravity, 'y', -10.0, 10.0, 0.1)
      physicsFolder.add(this.rapier.world.gravity, 'z', -10.0, 10.0, 0.1)
      */

  }
/*
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
*/
  private async floormesh() {
    const mesh = await this.world.addMesh({
      geometry: {type: 'box', args: [50, 1, 50]}, // geometry 속성
      material: {type: 'standard'}, // material 속성
      mesh: {receiveShadow: true, position:[0, -0.5, 0]}
    });

    // Rapier 생성
    const body: Body = new Body(this.rapier);
    await body.create({
      body: {type: 'fixed', translation: new THREE.Vector3(0, -1, 0)},
      collider: {shape: 'cuboid', args:[25, 0.5, 25]},
      object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }


}

class AnimationController {
  private scene: any;
  private wait = false;
  private animationActions: any = {};
  private activeAction: any;
  public speed = 0;
  private keyboard: any;
  public model!: Eve;

  constructor(scene: any, keyboard: any) {
      this.scene = scene
      this.keyboard = keyboard
  }

  async init() {
      this.model = new Eve();
      await this.model.init(this.animationActions);
      this.activeAction = this.animationActions['idle'];
      this.scene.add(this.model)
  }

  setAction(action: any) {
    if (this.activeAction != action) {
      this.activeAction.fadeOut(0.1)
      action.reset().fadeIn(0.1).play()
      this.activeAction = action

      switch (action) {
        case this.animationActions['walk']:
          this.speed = 5.25;
          break
        case this.animationActions['run']:
        case this.animationActions['jump']:
          this.speed = 16;
          break
        case this.animationActions['pose']:
        case this.animationActions['idle']:
          this.speed = 0;
          break
      }
    }
  }

  update(delta: number) {
    if (!this.wait) {
      let actionAssigned = false

      if (this.keyboard.keyMap['Space']) {
        this.setAction(this.animationActions['jump'])
        actionAssigned = true
        this.wait = true // blocks further actions until jump is finished
        setTimeout(() => (this.wait = false), 1200)
      }

      if (
        !actionAssigned &&
        (this.keyboard.keyMap['KeyW'] || this.keyboard.keyMap['KeyA'] || this.keyboard.keyMap['KeyS'] || this.keyboard.keyMap['KeyD']) &&
        this.keyboard.keyMap['ShiftLeft']
      ) {
        this.setAction(this.animationActions['run'])
        actionAssigned = true
      }

      if (
        !actionAssigned &&
        (this.keyboard.keyMap['KeyW'] || this.keyboard.keyMap['KeyA'] || this.keyboard.keyMap['KeyS'] || this.keyboard.keyMap['KeyD'])
      ) {

        this.setAction(this.animationActions['walk'])
        actionAssigned = true
      }

      if (!actionAssigned && this.keyboard.keyMap['KeyQ']) {
        this.setAction(this.animationActions['pose'])
        actionAssigned = true
      }

      !actionAssigned && this.setAction(this.animationActions['idle'])
    }

    // update the Eve models animation mixer
    this.model.update(delta)
  }
}

class Environment {
  /*
  scene
  light

  constructor(scene) {
      this.scene = scene

      this.scene.add(new GridHelper(50, 50))

      this.light = new DirectionalLight(0xffffff, Math.PI)
      this.light.position.set(65.7, 19.2, 50.2)
      this.light.castShadow = true
      this.scene.add(this.light)

      // const directionalLightHelper = new CameraHelper(this.light.shadow.camera)
      // this.scene.add(directionalLightHelper)

      const textureLoader = new TextureLoader()
      const textureFlare0 = textureLoader.load('./img/lensflare0.png')
      const textureFlare3 = textureLoader.load('./img/lensflare3.png')

      const lensflare = new Lensflare()
      lensflare.addElement(new LensflareElement(textureFlare0, 1000, 0))
      lensflare.addElement(new LensflareElement(textureFlare3, 500, 0.2))
      lensflare.addElement(new LensflareElement(textureFlare3, 250, 0.8))
      lensflare.addElement(new LensflareElement(textureFlare3, 125, 0.6))
      lensflare.addElement(new LensflareElement(textureFlare3, 62.5, 0.4))
      this.light.add(lensflare)
  }

  async init() {
      await new HDRJPGLoader(renderer).loadAsync('/img/venice_sunset_1k.hdr.jpg').then((texture) => {
          texture.renderTarget.texture.mapping = EquirectangularReflectionMapping
          this.scene.environment = texture.renderTarget.texture
          this.scene.background = texture.renderTarget.texture
          this.scene.backgroundBlurriness = 0.4
      })
  }
  */
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

  async init(animationActions: any) {
      const [eve, idle, run, jump, pose] = await Promise.all([
          this.glTFLoader.loadAsync('/assets/models/eve$@walk_compressed.glb'),
          this.glTFLoader.loadAsync('/assets/models/eve@idle.glb'),
          this.glTFLoader.loadAsync('/assets/models/eve@run.glb'),
          this.glTFLoader.loadAsync('/assets/models/eve@jump.glb'),
          this.glTFLoader.loadAsync('/assets/models/eve@pose.glb')
      ])
      eve.scene.traverse((m: any) => {
        if (m.isMesh) {
          m.castShadow = true
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
  camera
  pivot = new THREE.Object3D()
  yaw = new THREE.Object3D()
  pitch = new THREE.Object3D()

  constructor(scene: any, camera: any, renderer: any) {
      this.camera = camera

      this.yaw.position.y = 0.75

      document.addEventListener('pointerlockchange', () => {
          if (document.pointerLockElement === renderer.domElement) {
              renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove)
              renderer.domElement.addEventListener('wheel', this.onDocumentMouseWheel)
          } else {
              renderer.domElement.removeEventListener('mousemove', this.onDocumentMouseMove)
              renderer.domElement.removeEventListener('wheel', this.onDocumentMouseWheel)
          }
      })

      scene.add(this.pivot)
      this.pivot.add(this.yaw)
      this.yaw.add(this.pitch)
      this.pitch.add(camera) // adding the perspective camera to the hierarchy
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

class Game {
  /*
  scene
  camera
  renderer
  player
  world
  rapierDebugRenderer
  eventQueue

  constructor(scene, camera, renderer) {
      this.scene = scene
      this.camera = camera
      this.renderer = renderer
  }

  async init() {
      await RAPIER.init() // This line is only needed if using the compat version
      const gravity = new Vector3(0.0, -9.81, 0.0)

      this.world = new World(gravity)
      this.eventQueue = new EventQueue(true)

      this.rapierDebugRenderer = new RapierDebugRenderer(this.scene, this.world)
      const gui = new GUI()
      gui.add(this.rapierDebugRenderer, 'enabled').name('Rapier Degug Renderer')

      // // the floor (using a cuboid)
      const floorMesh = new Mesh(new BoxGeometry(50, 1, 50), new MeshStandardMaterial())
      floorMesh.receiveShadow = true
      floorMesh.position.y = -0.5
      this.scene.add(floorMesh)
      const floorBody = this.world.createRigidBody(RigidBodyDesc.fixed().setTranslation(0, -0.5, 0))
      const floorShape = ColliderDesc.cuboid(25, 0.5, 25)
      this.world.createCollider(floorShape, floorBody)

      this.player = new Player(this.scene, this.camera, this.renderer, this.world, [0, 0.1, 0])
      await this.player.init()

      const environment = new Environment(this.scene)
      await environment.init()
      environment.light.target = this.player.followTarget

      const ui = new UI(this.renderer)
      ui.show()
      
  }

  update(delta) {
      this.world.timestep = Math.min(delta, 0.1)
      this.world.step(this.eventQueue)
      this.eventQueue.drainCollisionEvents((_, __, started) => {
          if (started) {
              this.player.setGrounded()
          }
      })
      this.player.update(delta)
      this.rapierDebugRenderer.update()
  }*/
}


class Keyboard {
  private keyMap: any = {}

  constructor(renderer:THREE.WebGLRenderer) {
      document.addEventListener('pointerlockchange', () => {
          if (document.pointerLockElement === renderer.domElement) {
              document.addEventListener('keydown', this.onDocumentKey)
              document.addEventListener('keyup', this.onDocumentKey)
          } else {
              document.removeEventListener('keydown', this.onDocumentKey)
              document.removeEventListener('keyup', this.onDocumentKey)
          }
      })
  }

  onDocumentKey = (e: KeyboardEvent) => {
      this.keyMap[e.code] = e.type === 'keydown'
  }
}

class Player {
  private game: ObstacleCourseGamePart1;
  private scene: any;
  private world: any;
  private body: any;
  private animationController!: AnimationController;
  private vector = new THREE.Vector3();
  private inputVelocity = new THREE.Vector3()
  private euler = new THREE.Euler()
  private quaternion = new THREE.Quaternion()
  public  followTarget = new THREE.Object3D() //new Mesh(new SphereGeometry(0.1), new MeshNormalMaterial())
  private grounded = true
  private rotationMatrix = new THREE.Matrix4()
  private  targetQuaternion = new THREE.Quaternion()
  private followCam: any;
  private keyboard: any;
  private wait = false;

  // constructor(scene:THREE.Scene, camera: THREE.Camera, renderer:THREE.WebGLRenderer, world:any, position = [0, 0, 0]) {
  constructor(game: ObstacleCourseGamePart1, position = [0, 0, 0]) {
    this.game = game;
    this.scene = game.world.scene;
    this.world = game.world;
    // this.keyboard = new Keyboard(game.world.renderer)
    this.followCam = new FollowCam(this.scene, game.world.camera, game.world.renderer)
    this.game.light.target = this.followTarget;
    this.scene.add(this.followTarget) // the followCam will lerp towards this object3Ds world position.

    this.create();
  }

  private async create() {

    // Rapier 생성
    const body: Body = new Body(this.game.rapier);
    await body.create({
      body: {
        type:'dynamic', translation:[0, 0, 0], linearDamping: 4, 
        enabledRotations: [false, false, false], canSleep: false
      },
      collider: {
        shape: 'capsule', args: [0.5, 0.15], translation: [0, 0.645, 0], 
        mass:0.1, friction: 0, restitution: 0.5,
        // activeEvents: 'COLLISION_EVENTS',
        onCollisionEnter: () =>{
         
          this.setGrounded();
        }
      },
      
    });


    this.body = body.rigidBody;
/*
    this.body = this.world.createRigidBody(
      RigidBodyDesc.dynamic()
          // .setTranslation(...position)
          .setTranslation(0, 0, 0)
          .enabledRotations(false, false, false)
          .setLinearDamping(4)
          .setCanSleep(false)
    )

    const shape = ColliderDesc.capsule(0.5, 0.15)
        .setTranslation(0, 0.645, 0)
        .setMass(1)
        .setFriction(0)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS)

    this.world.createCollider(shape, this.body)
    */
  }

  async init() {
      this.animationController = new AnimationController(this.scene, this.game.evListener)
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
      // const delta = clock.delta;
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


          this.inputVelocity.setLength(clock.delta * 0.1 * (this.animationController.speed || 1)) // limit horizontal movement based on walking or running speed
          if (!this.wait && this.game.evListener.keyMap['Space']) {
              this.wait = true
              this.body.setLinearDamping(0)
              if (this.game.evListener.keyMap['ShiftLeft']) {
                this.inputVelocity.multiplyScalar(15)
              } else {
                // this.inputVelocity.multiplyScalar(10)
                this.inputVelocity.multiplyScalar(1)
              }
              this.inputVelocity.y = 1 // give jumping some height
              this.grounded = false
          }
      }

      // // apply the followCam yaw to inputVelocity so the capsule moves forward based on cameras forward direction
      this.euler.y = this.followCam.yaw.rotation.y
      this.quaternion.setFromEuler(this.euler)
      this.inputVelocity.applyQuaternion(this.quaternion)

      // now move the capsule body based on inputVelocity
      
      this.body.applyImpulse(this.inputVelocity, true)
      // this.body.applyImpulse(new THREE.Vector3(1, 0, 0), true)
      // this.body.applyImpulse(0.0002, true)

      // // The followCam will lerp towards the followTarget position.
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

class RapierDebugRenderer {
  /*
  mesh
  world
  enabled = true

  constructor(scene, world) {
      this.world = world
      this.mesh = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: 0xffffff, vertexColors: true }))
      this.mesh.frustumCulled = false
      scene.add(this.mesh)
  }

  update() {
      if (this.enabled) {
          const { vertices, colors } = this.world.debugRender()
          this.mesh.geometry.setAttribute('position', new BufferAttribute(vertices, 3))
          this.mesh.geometry.setAttribute('color', new BufferAttribute(colors, 4))
          this.mesh.visible = true
      } else {
          this.mesh.visible = false
      }
  }
  */
}

class UI {
  private renderer: THREE.WebGLRenderer;
  private instructions:HTMLElement | null

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer

    this.instructions = document.getElementById('instructions')

    const startButton:HTMLElement | null = document.getElementById('startButton');
    if(startButton) {
      startButton.addEventListener(
          'click',
          () => {
              renderer.domElement.requestPointerLock()
          },
          false
      )
    }

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.renderer.domElement) {
        this.instructions ? this.instructions.style.display = 'none': null;
      } else {
        this.instructions ? this.instructions.style.display = 'block': null;
      }
    })
  }


  private show() {
    (document as any).getElementById('spinner').style.display = 'none';
    this.instructions ? this.instructions.style.display = 'block': null;
  }
}