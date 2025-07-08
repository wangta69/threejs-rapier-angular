
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';
//https://sbedit.net/afbc21b9d6defe5c5bd2fcda6d6e2f1af0cebb26

// import Stats from 'three/addons/libs/stats.module.js'

import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import RAPIER from '@dimforge/rapier3d-compat'
import {Rapier, World, Body, Light, LensFlare, Mesh, LoaderRGBE, EventListener, ClockProps} from '../../../../projects/ng-rapier-threejs/src/public-api';
import {_vector3, _euler, _quaternion, _object3d, _matrix4} from '../../../../projects/ng-rapier-threejs/src/public-api';
// import { LoaderGLTF } from 'ng-rapier-threejs';
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
export class ObstacleCourseGamePart2 implements AfterViewInit {
  @ViewChild('domContainer', {static: true}) domContainer!: ElementRef;

  public world!:World
  public evListener: EventListener;
  public rapier!:Rapier;
  public pivot = new THREE.Object3D();
  public light!: THREE.DirectionalLight;

  private pendulums:Pendulum[] = [];
  private spinners:Spinner[] = [];
  private player!:Player;
  private finish!:Finish;

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
      // .setGridHelper({args: [50, 50]})
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

      new Start(this, [0, -0.5, 0]);

      new Platform(this, [1, 0.1, 2], [0, 0, 6])
      new Platform(this, [2.5, 0.1, 1], [3, 0.25, 6])
      new Platform(this, [2, 0.1, 1], [6, 1, 6])
      new Platform(this, [0.25, 0.1, 4.5], [6, 2, 2.25])
      new Platform(this, [4, 0.1, 5], [6, 2, -3])
      this.spinners.push(new Spinner(this, [6, 2.8, -3]))
      new Platform(this, [1, 0.1, 2], [6.25, 2.5, -7.5])
      new Platform(this, [4, 0.1, 4], [2.5, 3, -8])
      this.spinners.push(new Spinner(this, [2.5, 3.8, -8]))
      new Platform(this, [1, 0.1, 2.75], [1.5, 3.75, -3.25], [-Math.PI / 8, 0, 0])
      new Platform(this, [6, 0.1, 1], [-1, 4.5, -1])
      this.pendulums.push(new Pendulum(this, [0, 8, -1]))
      this.pendulums.push(new Pendulum(this, [-2, 8, -1]))
      new Platform(this, [1.5, 0.1, 8], [-5.5, 4.5, 4.5], [0, 0, -Math.PI / 8])
      this.pendulums.push(new Pendulum(this, [-5, 8, 2.5], Math.PI / 2))
      this.pendulums.push(new Pendulum(this, [-5, 8, 5], Math.PI / 2))
      this.finish = new Finish(this, [0, 4.0, 10])

      this.player = new Player(this)
      await this.player.init();

      const texture = await new LoaderRGBE().loader('assets/images/venice_sunset_1k.hdr', {mapping: 'EquirectangularReflectionMapping'})
      this.world.scene.environment = texture;
      this.world.scene.background = texture;
      this.world.scene.backgroundBlurriness =  0.4;

      this.evListener.activeClickEvent(this.world.renderer);
      this.evListener.activePointerlockchange(this.world.renderer);
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

      let keyDetected = false;
      if(this.evListener.keyMap['KeyW'] || this.evListener.keyMap['KeyA'] || this.evListener.keyMap['KeyS'] || this.evListener.keyMap['KeyD']
        ||  this.evListener.keyMap['ArrowUp'] || this.evListener.keyMap['ArrowDown'] || this.evListener.keyMap['ArrowLeft'] || this.evListener.keyMap['ArrowRight']
      ) {
        keyDetected = true;
      }

      if (
        !actionAssigned && keyDetected &&
        this.evListener.keyMap['ShiftLeft']
      ) {
        this.setAction(this.animationActions['run'])
        actionAssigned = true
      }

      if (
        !actionAssigned && keyDetected
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

    this.glTFLoader = new GLTFLoader();
    this.glTFLoader.setDRACOLoader(dracoLoader);
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

  constructor(game: ObstacleCourseGamePart2) {
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

  private game: ObstacleCourseGamePart2;

  private body!: Body;
  private animationController!: AnimationController;
  private vector = _vector3.clone();
  private inputVelocity = _vector3.clone();
  private euler = _euler.clone();
  private quaternion = _quaternion.clone();
  public  followTarget = _object3d.clone(); //new Mesh(new SphereGeometry(0.1), new MeshNormalMaterial())
  private grounded = true
  private rotationMatrix = _matrix4.clone();
  private targetQuaternion = _quaternion.clone();
  private followCam: any;
  private wait = false;

  constructor(game: ObstacleCourseGamePart2) {
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
        onCollisionEnter: (handle1: number, handle2: number) =>{ // activeEvents: 'COLLISION_EVENTS',
          this.setGrounded();
          if ([handle1, handle2].includes(this.body?.rigidBody.handle)) {
            // this.ui.showLevelCompleted()
          }
        }
      }
    }, (body: Body) =>{
      this.body = body;
    })
  }

  async init() {
    this.animationController = new AnimationController(this.game.world.scene, this.game.evListener)
    await this.animationController.init()
    this.game.world.updates.push((clock:ClockProps)=>{this.update(clock)});
  }

  private setGrounded() {
    this.body.rigidBody.setLinearDamping(4)
    this.grounded = true
    setTimeout(() => (this.wait = false), 250)
  }

  update(clock: ClockProps) {
    this.inputVelocity.set(0, 0, 0);
    let limit = 1;
    if (this.grounded) {
      if (this.game.evListener.keyMap['KeyW'] || this.game.evListener.keyMap['ArrowUp']) {
        this.inputVelocity.z = -1;
        limit = 9.5;
      }
      if (this.game.evListener.keyMap['KeyS'] || this.game.evListener.keyMap['ArrowDown']) {
        this.inputVelocity.z = 1;
        limit = 9.5;
      }
      if (this.game.evListener.keyMap['KeyA'] || this.game.evListener.keyMap['ArrowLeft']) {
        this.inputVelocity.x = -1;
        limit = 9.5;
      }
      if (this.game.evListener.keyMap['KeyD'] || this.game.evListener.keyMap['ArrowRight']) {
        this.inputVelocity.x = 1;
        limit = 9.5;
      }

      this.inputVelocity.setLength(clock.delta * (this.animationController.speed || 1)) // limit horizontal movement based on walking or running speed
      // this.inputVelocity.setLength(clock.delta * limit);
      if (!this.wait && this.game.evListener.keyMap['Space']) {
        this.wait = true
        this.body.rigidBody.setLinearDamping(0)
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
    this.body.rigidBody.applyImpulse(this.inputVelocity, true)



    if (this.body.rigidBody.translation().y < -3) {
      this.reset()
    }

    this.followTarget.position.copy(this.body.rigidBody.translation()) // Copy the capsules position to followTarget
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

  private reset() {
    this.body.rigidBody.setLinvel(new THREE.Vector3(0, 0, 0), true)
    this.body.rigidBody.setTranslation(new THREE.Vector3(0, 1, 0), true)
    // this.ui.reset()
  }
}

class Start {
  private game:ObstacleCourseGamePart2;
  private glTFLoader!: GLTFLoader;
  private position: number[];
  private material!: THREE.MeshStandardMaterial;
  
  constructor(game: ObstacleCourseGamePart2, position: number[]) {
    this.glTFLoader = new GLTFLoader();
    this.position = position;
    this.game = game;
    this.init();
  }

  async init() {
    await this.game.world.addObjectFromGLTF({
      url: '/assets/models/start.glb', 
      props:[{
        name:'Cylinder', 
        mesh:{receiveShadow:true},
        rapier: {
          body: {type:'fixed', translation: [...this.position]},
          collider: {shape: 'convexHull'},
        }
      }]
    }, async (ele)=>{     
      ele.forEach( (obj:any) =>{
        this.material = <THREE.MeshStandardMaterial>(<THREE.Mesh>obj.mesh).material;
        if(this.material && this.material.map) {
          this.material.map?.center.set(0.1034, 0) // fixes slightly offset texture
      
          setInterval(() => {
            if(this.material && this.material.map) {
              this.material.map.rotation += Math.PI;
            }
          }, 500)
        }
      })
    });
  }
}

class Finish {
  private game:ObstacleCourseGamePart2;
  private position: number[];
  private material!:THREE.MeshStandardMaterial;
  private texture!:THREE.Texture;

  constructor(game:ObstacleCourseGamePart2, position:number[]) {
    this.game = game;
    this.position = position;

    this.init();
  }

  private async init() {
    this.texture = new THREE.TextureLoader().load('/assets/images/finish.png', (texture) => {
      texture.repeat.x = 2
      texture.wrapS = THREE.RepeatWrapping
      texture.flipY = true
    })

    const banner = new THREE.Mesh(
        new THREE.CylinderGeometry(3.4, 3.4, 2, 12, 1, true),
        new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.75, map: this.texture, side: THREE.DoubleSide })
    )
    banner.position.set(...(this.position as [number, number, number]) );
    banner.position.y += 3
    this.game.world.scene.add(banner)


    await this.game.world.addObjectFromGLTF({
      url: '/assets/models/finish.glb', 
      props:[{
        name:'Cylinder', 
        mesh:{receiveShadow:true},
        rapier: {
          body: {type:'fixed', translation: [...this.position]},
          collider: {shape: 'convexHull'},
        }
      }]
    }, async (ele)=>{     
      ele.forEach( (obj:any) =>{
        this.material = <THREE.MeshStandardMaterial>(<THREE.Mesh>obj.mesh).material;
        if(this.material && this.material.map) {
          setInterval(() => {
            if(this.material && this.material.map) {
              this.material.map.rotation += Math.PI
            }
          }, 500)
        }
      })
    });
  }
  
}


class Spinner {
  private game:ObstacleCourseGamePart2;
  private position: number[];
  private group!: THREE.Group;
  private body!: RAPIER.RigidBody;
  private handle = -1

  constructor(game:ObstacleCourseGamePart2, position:number[]) {
    this.game = game;
    this.position = position;
    this.init();
  }

  private async init() {
    this.group = new THREE.Group()
    // this.group.position.set(...this.position)
    this.group.position.set(this.position[0],this.position[1], this.position[2])
    
    this.game.world.scene.add(this.group)

    const verticleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.5), new THREE.MeshStandardMaterial())
    verticleBar.castShadow = true;
    // verticleBar.position.set(this.position[0],this.position[1], this.position[2])
    this.group.add(verticleBar)

    const horizontalBar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4), new THREE.MeshStandardMaterial())
    horizontalBar.rotateX(-Math.PI / 2)
    horizontalBar.castShadow = true
    this.group.add(horizontalBar)

    const body: Body = new Body(this.game.world.rapier);
    await body.create({
      body: {type: 'kinematicPositionBased', 
        translation: [this.position[0],this.position[1], this.position[2]],
        rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
      }, // , translation: new THREE.Vector3(0, -1, 0)
      collider: {shape: 'cylinder', args:[2, 0.25]},
      // object3d: horizontalBar
    });

    body.useFrame = (clock: any) => {
      const delta = clock.delta;
      this.group.rotation.y += delta

      let quaternion = new THREE.Quaternion();
      horizontalBar.getWorldQuaternion ( quaternion );

      body.rigidBody.setNextKinematicRotation(quaternion);
    };
  }
}

class Pendulum {
  private game:ObstacleCourseGamePart2;
  private position: number[];
  private rotationY: number;
  dynamicBodies = []
  handles = [-1, -1]

  constructor(game:ObstacleCourseGamePart2, position:number[], rotationY = 0) {
      this.game = game;
      this.position = position;
      this.rotationY = rotationY;
      this.init();
  }

  private async init() {
    const parents:any[] = [];
    for (let i = 0; i < 4; i++) {

      let rapierBodyType = 'dynamic';
      if (i == 0) {
        rapierBodyType = 'fixed';
      }

      await this.game.world.addObject({
        geometry: {type: 'sphere', args: [0.4]}, // geometry 속성
        material: {type: 'standard'}, // material 속성
        mesh: {castShadow:true},
        rapier: {
          body: {type: rapierBodyType, translation: [this.position[0], this.position[1], i + this.position[2]], rotation: [0, this.rotationY, 0]},
          collider: {shape: 'ball', mass: 1},
        }, 
      }, (mesh, body) => {
        if (i >= 2) {
          // will check for collisions with lowest 2 hanging balls in game.ts update loop
          if(body) {
            this.handles.push(body.rigidBody.handle);
          }
        }

        if (i > 0) {
          let parent = parents[parents.length - 1];
          let params = RAPIER.JointData.spherical(new THREE.Vector3(0.0, 0.0, 0.0), new THREE.Vector3(0.0, 0.0, -1))
          if(body) {
            this.game.world.rapier.world.createImpulseJoint(params, parent, body.rigidBody, true);
          }
        }

        parents.push(body?.rigidBody);

      });
    }
  }
}

class Platform {
  private game:ObstacleCourseGamePart2;
  private size: number[];
  private position: number[];
  private rotation: number[];
  constructor(game:ObstacleCourseGamePart2, size: number[], position: number[], rotation = [0, 0, 0]) {
    this.game = game;
    this.size = size;
    this.position = position;
    this.rotation = rotation;
    this.init();
  }

  async init() {
    await this.game.world.addObject({
      geometry: {type: 'box', args: this.size}, // geometry 속성
      material: {type: 'standard'}, // material 속성
      mesh: {castShadow:true, receiveShadow: true},
      rapier: {
        body: {type: 'fixed', translation: this.position, rotation: this.rotation},
        collider: {shape: 'cuboid'},
      }, 
    }, (mesh, body) => {
    });
  }
}

