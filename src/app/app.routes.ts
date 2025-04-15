import { Routes } from '@angular/router';

import { RapierSample1Component } from './physics-engine/rapier/exmaple1';
import { RapierSample2Component } from './physics-engine/rapier/exmaple2';
import { CarDriveComponent } from './physics-engine/rapier/car-drive';
import { ObstacleCourseGamePart1 } from './physics-engine/rapier/obstacle-course-game-part1';
import { ObstacleCourseGamePart2 } from './physics-engine/rapier/obstacle-course-game-part2';
import { RapierSample2Component as  RapierSample2ComponentOriginal} from './physics-engine/rapier/_origianl';
export const routes: Routes = [
  { path: 'physics-engine/rapier/exmaple1', component: RapierSample1Component },
  { path: 'physics-engine/rapier/exmaple2', component: RapierSample2Component },
  { path: 'physics-engine/rapier/exmaple2-original', component: RapierSample2ComponentOriginal },
  { path: 'physics-engine/rapier/car-drive', component: CarDriveComponent },
  { path: 'physics-engine/rapier/obstacle-course-game-part1', component: ObstacleCourseGamePart1 },
  { path: 'physics-engine/rapier/obstacle-course-game-part2', component: ObstacleCourseGamePart2 },
];
