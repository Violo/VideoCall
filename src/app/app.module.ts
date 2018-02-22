import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { RoomComponent } from './pages/room/room.component';

import { AppComponent } from './app.component';

const routes: Routes = [{
    path: 'homepage',
    component: HomepageComponent,
    pathMatch: 'full'
  }, {
    path: '',
    redirectTo: 'homepage',
    pathMatch: 'full'
  }, {
    path: 'room',
    component: RoomComponent,
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    AppComponent,
    HomepageComponent,
    RoomComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes, { useHash: true })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
