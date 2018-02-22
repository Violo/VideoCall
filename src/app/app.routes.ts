import { HomepageComponent } from './pages/homepage/homepage.component';
import { RoomComponent } from './pages/room/room.component';

import { Routes } from '@angular/router';

export const routes: Routes = [{
    path: 'homepage',
    component: HomepageComponent,
    pathMatch: 'full'
  }, {
    path: '',
    redirectTo: 'homepage',
    pathMatch: 'full'
  }, {
    path: 'room/:name',
    component: RoomComponent,
    pathMatch: 'full'
  }
];
