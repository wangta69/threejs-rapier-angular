
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as THREE from 'three';
// https://sbcode.net/threejs/physics-rapier-impulsejoint-motors/
// https://sbedit.net/embed/d00b6d21064f1313f556563cd471ccdbf7d7578f
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import RAPIER from '@dimforge/rapier3d-compat'
// import {Rapier, World, Mesh, Body} from 'ng-rapier-threejs';
import {Rapier, World, Mesh, Body, Light, LensFlare, EventListener} from '../../../../projects/ng-rapier-threejs/src/public-api';

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
      .setLights([
        {
        type: 'spot',
        intensity: Math.PI * 10,
        angle: Math.PI / 1.8,
        penumbra: 0.5,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      },{
        type: 'spot',
        intensity: Math.PI * 10,
        position: [-2.5, 5, 5],
        angle: Math.PI / 1.8,
        penumbra: 0.5,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      }])
      .enableControls({damping: true, target:{x: 0, y: 1, z: 0}})
      .setGridHelper({position: {x: 0, y: -75, z: 0}})
      .update(); // requestAnimationFrame(this.update)

      await this.rapier.initRapier(0.0, -9.81, 0.0);
      this.rapier.enableRapierDebugRenderer();

      this.addRendererOption();


      this.evListener.activeClickEvent(this.world.renderer);
      this.evListener.activePointerlockchange(this.world.renderer);

      this.createFloorMesh();

      // this.createCubeMesh();
      // this.createSphereMesh();
      // this.createCylinderMesh();
      // this.createIcosahedronMesh(); 
      // this.createTorusKnotMesh();
      // this.createOBJLoader();
      const pivot = new THREE.Object3D()
      const yaw = new THREE.Object3D()
      const pitch = new THREE.Object3D()

      this.world.scene.add(pivot)
      pivot.add(yaw)
      yaw.add(pitch)

      new Car(this, [0, 0, 0], pivot)
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

  // private async createCubeMesh() {
  
  //   const mesh = await new Mesh().create({
  //     geometry: {type: 'box', args: [1, 1, 1]}, // geometry 속성
  //     material: {type: 'normal'}, // material 속성
  //     mesh: { castShadow: true}
  //   });
  //   this.world.scene.add(mesh);

  //   // Rapier 생성
  //   const body: Body = new Body(this.rapier);
  //   await body.create({
  //     body: {type:'dynamic', translation:new THREE.Vector3(0, 5, 0), canSleep: false},
  //     collider: {mass:1, restitution: 0.5},
  //     object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
  //   });
  // }

  // private async createSphereMesh() {
  
  //   const mesh = await new Mesh().create({
  //     geometry: {type: 'sphere'}, // geometry 속성
  //     material: {type: 'normal'}, // material 속성
  //     mesh: {receiveShadow: true}
  //   });

  //   this.world.scene.add(mesh);

  //   // Rapier 생성
  //   const body: Body = new Body(this.rapier);
  //   await body.create({
  //     body: {type:'dynamic', translation: new THREE.Vector3(-2.5, 5, 0), canSleep: false},
  //     collider: {shape: 'ball', restitution: 0.5},
  //     object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
  //   });
  // }

  // private async createCylinderMesh() {
  //   const mesh = await new Mesh().create({
  //     geometry: {type: 'cylinder', args: [1, 1, 2, 16]}, // geometry 속성
  //     material: {type: 'normal'}, // material 속성
  //     mesh: {castShadow: true}
  //   });

  //   this.world.scene.add(mesh);

  //   // Rapier 생성
  //   const body: Body = new Body(this.rapier);
  //   await body.create({
  //     body: {type:'dynamic', translation: new THREE.Vector3(0, 5, 0), canSleep: false},
  //     collider: {shape: 'cylinder', mass:1, restitution: 0.5},
  //     object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
  //   });
  // }

  // private async createIcosahedronMesh() {
      
  //   const mesh = await new Mesh().create({
  //     geometry: {type: 'icosahedron', args: [1, 0]}, // geometry 속성
  //     material: {type: 'normal'}, // material 속성
  //     mesh: {receiveShadow: true}
  //   });

  //   this.world.scene.add(mesh);

  //   // Rapier 생성
  //   const body: Body = new Body(this.rapier);
  //   await body.create({
  //     body: {type:'dynamic', translation:new THREE.Vector3(2.5, 5, 0), canSleep: false},
  //     collider: {shape: 'convexHull', mass:1, restitution: 0.5},
  //     object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
  //   });
  // }

  // private async createTorusKnotMesh() {
        
  //   const mesh = await new Mesh().create({
  //     geometry: {type: 'torusknot'}, // geometry 속성
  //     material: {type: 'normal'}, // material 속성
  //     mesh: {receiveShadow: true}
  //   });

  //   this.world.scene.add(mesh);

  //   // Rapier 생성
  //   const body: Body = new Body(this.rapier);
  //   await body.create({
  //     body: {type:'dynamic', translation:new THREE.Vector3(5, 5, 0)},
  //     collider: {shape: 'trimesh', mass:1, restitution: 0.5},
  //     object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
  //   });
  // }

  // private async createOBJLoader() {
  //   const mesh = await new Mesh().loadObj({
  //     material: {type: 'normal'}, // material 속성
  //     mesh: {castShadow: true, url: '/assets/suzanne.obj', name: 'Suzanne'}
  //   });

  //   this.world.scene.add(mesh);

  //   const body: Body = new Body(this.rapier);
  //   await body.create({
  //     body: {type:'dynamic', translation:new THREE.Vector3(-1, 10, 0)},
  //     collider: {shape: 'trimesh', mass:1, restitution: 0.5},
  //     object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
  //   });
  // }

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


  private dynamicBodies: [THREE.Object3D, RAPIER.RigidBody][] = []
  private followTarget = new THREE.Object3D()
  private lightLeftTarget = new THREE.Object3D()
  private lightRightTarget = new THREE.Object3D()
  private carBody?: RAPIER.RigidBody


  private wheelBLMotor!: RAPIER.ImpulseJoint
  private wheelBRMotor!: RAPIER.ImpulseJoint
  private wheelFLAxel!: RAPIER.ImpulseJoint
  private wheelFRAxel!: RAPIER.ImpulseJoint

  private v = new THREE.Vector3()
  private keyMap!: { [key: string]: boolean }
  private pivot!: THREE.Object3D

  constructor(game: any, translation:number[] = [0, 0, 0], pivot: THREE.Object3D) {
    this.game = game;
    this.translation = translation;
    

    this.followTarget.position.set(0, 1, 0);
    this.lightLeftTarget.position.set(-0.35, 1, -10);
    this.lightRightTarget.position.set(0.35, 1, -10);
    this.pivot = pivot;

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

      const lensflareRight =  lensflareLeft.clone();

      const headLightLeft = new Light({
        type: 'spot',
        position: [-0.4, 0.5, -1.01],
        angle: Math.PI / 4,
        penumbra: 0.5,
        castShadow: true,
        shadow: {blurSamples: 10, radius: 5}
      }).get();

      

      const headLightRight = headLightLeft.clone()
      headLightRight.position.set(0.4, 0.5, -1.01)

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
        collider: { shape: 'convexHull', restitution: 0.1},
        object3d: carMesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
      });

      const wheelBLBody: Body = new Body(this.game.rapier);
      wheelBLBody.create({ // shape: 'cylinder',
        body : {type:'dynamic', translation: position.clone().add(new THREE.Vector3(-1, 1, 1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.05, friction: 2,
          translation: new THREE.Vector3(-0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2)
        },
        object3d: wheelBLMesh
      });

      const wheelBRBody: Body = new Body(this.game.rapier);
      wheelBRBody.create({ // shape: 'cylinder',
        body : {type:'dynamic', translation: position.clone().add(new THREE.Vector3(1, 1, 1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.05, friction: 2,
          translation: new THREE.Vector3(0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
        },
        object3d: wheelBRMesh
      });

      const wheelFLBody: Body = new Body(this.game.rapier);
      wheelFLBody.create({ // shape: 'cylinder',
        body : {type:'dynamic', translation: position.clone().add(new THREE.Vector3(-1, 1, -1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.05, friction: 2,
          translation: new THREE.Vector3(-0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
        },
        object3d: wheelFLMesh
      });

      const wheelFRBody: Body = new Body(this.game.rapier);
      wheelFRBody.create({
        body: {type:'dynamic', translation: position.clone().add(new THREE.Vector3(1, 1, -1)), canSleep: false},
        collider: {shape: 'cylinder', args: [0.1, 0.3], restitution: 0.05, friction: 2,
          translation: new THREE.Vector3(0.2, 0, 0),
          rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
        },
        
        object3d: wheelFRMesh
      });


      const axelFLBody: Body = new Body(this.game.rapier);
      axelFLBody.create({
        body: {type:'dynamic', translation: position.clone().add(new THREE.Vector3(-0.55, 0, -0.63)), canSleep: false},
        collider: {
          shape: 'cuboid', args: [0.1, 0.1, 0.1], mass: 1, rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
        }
      });

      const axelFRBody: Body = new Body(this.game.rapier);
      axelFRBody.create({
        body: {type:'dynamic', translation: position.clone().add(new THREE.Vector3(0.55, 0, -0.63)), canSleep: false},
        collider: {
          shape: 'cuboid', args: [0.1, 0.1, 0.1], mass: 1, rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
        }
      });

      /*
        RigidBodyDesc.dynamic()
          .setTranslation(position[0] + 0.55, position[1], position[2] - 0.63)
          .setCanSleep(false)
      )
*/

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
/*
      this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new  RAPIER.Vector3(-0.55, 0, 0.63), new  RAPIER.Vector3(0, 0, 0), new  RAPIER.Vector3(-1, 0, 0)),
        carBody.rigidBody, 
        wheelBLBody.rigidBody,
        true)
      this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new  RAPIER.Vector3(0.55, 0, 0.63), new  RAPIER.Vector3(0, 0, 0), new  RAPIER.Vector3(-1, 0, 0)),
        carBody.rigidBody, 
        wheelBRBody.rigidBody, 
        true)
        */
        this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new  RAPIER.Vector3(-0.55, 0, -0.63), new  RAPIER.Vector3(0, 0, 0), new  RAPIER.Vector3(-1, 0, 0)),
        carBody.rigidBody, 
        wheelFLBody.rigidBody,
        true)
        this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new  RAPIER.Vector3(0.55, 0, -0.63), new  RAPIER.Vector3(0, 0, 0), new  RAPIER.Vector3(-1, 0, 0)),
        carBody.rigidBody, 
        wheelFRBody.rigidBody,
        true)

    

      this.wheelFLAxel = this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(-0.55, 0, -0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(0, 1, 0)),
        carBody.rigidBody,
        axelFLBody.rigidBody,
        true
      );
      // // (this.wheelFLAxel as RAPIER.PrismaticImpulseJoint).configureMotorModel(RAPIER.MotorModel.ForceBased)

      this.wheelFRAxel = this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(0.55, 0, -0.63), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(0, 1, 0)),
        carBody.rigidBody,
        axelFRBody.rigidBody,
        true
      );
      /*
      this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(1, 0, 0)), 
        axelFLBody.rigidBody, 
        wheelFLBody.rigidBody, 
        true)
      this.game.rapier.world.createImpulseJoint(
        RAPIER.JointData.revolute(new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(1, 0, 0)), 
        axelFRBody.rigidBody,
        wheelFRBody.rigidBody, 
        true)
        */

    });

    this.game.world.updates.push((clock:any)=>{this.update(clock)});
  }

  private update(clock: any) {
    // this.followTarget.getWorldPosition(this.v)
    // this.pivot.position.lerp(this.v, delta * 5) // frame rate independent

    //this.pivot.position.copy(this.v)

    // console.log(this.game.evListener.keyMap);
    let targetVelocity = 0
    if (this.game.evListener.keyMap['KeyW']) {
      targetVelocity = 500
    }
    if (this.game.evListener.keyMap['KeyS']) {
      targetVelocity = -200
    }

    // console.log('targetVelocity:', targetVelocity);
    (this.wheelBLMotor as RAPIER.PrismaticImpulseJoint).configureMotorVelocity(targetVelocity, 2.0);
    (this.wheelBRMotor as RAPIER.PrismaticImpulseJoint).configureMotorVelocity(targetVelocity, 2.0);

    let targetSteer = 0
    if (this.game.evListener.keyMap['KeyA']) {
      // targetSteer += 0.6
      targetSteer -= 6
    }
    if (this.game.evListener.keyMap['KeyD']) {
      // targetSteer -= 0.6
      targetSteer -= 6
    }

    console.log('targetSteer:', targetSteer);
    // (this.wheelFLAxel as RAPIER.PrismaticImpulseJoint).configureMotorPosition(targetSteer, 100, 10);
    // // (this.wheelFLAxel as RAPIER.PrismaticImpulseJoint).configureMotorModel(RAPIER.MotorModel.ForceBased);
    // (this.wheelFRAxel as RAPIER.PrismaticImpulseJoint).configureMotorPosition(targetSteer, 100, 10);
    // (this.wheelFRAxel as RAPIER.PrismaticImpulseJoint).configureMotorModel(RAPIER.MotorModel.ForceBased);

      //   // attach steering axels to car. These will be configurable motors.
      //   this.wheelFLAxel = world.createImpulseJoint(JointData.revolute(new Vector3(-0.55, 0, -0.63), new Vector3(0, 0, 0), new Vector3(0, 1, 0)), this.carBody, axelFLBody, true)
      //   ;(this.wheelFLAxel as PrismaticImpulseJoint).configureMotorModel(MotorModel.ForceBased)
      //   this.wheelFRAxel = world.createImpulseJoint(JointData.revolute(new Vector3(0.55, 0, -0.63), new Vector3(0, 0, 0), new Vector3(0, 1, 0)), this.carBody, axelFRBody, true)
      //   ;(this.wheelFRAxel as PrismaticImpulseJoint).configureMotorModel(MotorModel.ForceBased)

      //   // // at

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
    const mesh = await new Mesh().create({
      geometry: {type: 'box', args: [1, 1, 1]}, // geometry 속성
      material: {type: 'standard'}, // material 속성
      mesh: { castShadow: true}
    });
    this.game.world.scene.add(mesh);

    // const boxMesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial())
    // boxMesh.castShadow = true
    // scene.add(boxMesh)

    // Rapier 생성
    const body: Body = new Body(this.game.rapier);
    await body.create({
      body: {type:'dynamic', translation:this.translation, canSleep: false},
      collider: {mass:1, restitution: 0.5},
      object3d: mesh // 위에서 생성한 ThreeJs의 mesh를 넣어주면 mesh의 속성(shape, postion, scale등등을 자동으로 처리합니다 )
    });
  }
}