import { Routes } from '@angular/router';

import { RapierSample1Component } from './physics-engine/rapier/exmaple1';
import { RapierSample2Component } from './physics-engine/rapier/exmaple2';
import { RapierSample2Component as  RapierSample2ComponentOriginal} from './physics-engine/rapier/_origianl';
export const routes: Routes = [
  { path: 'physics-engine/rapier/exmaple1', component: RapierSample1Component },
  { path: 'physics-engine/rapier/exmaple2', component: RapierSample2Component },
  { path: 'physics-engine/rapier/exmaple2-original', component: RapierSample2ComponentOriginal },
];
