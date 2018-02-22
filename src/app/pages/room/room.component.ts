import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html'
})
export class RoomComponent {

  topic: string;
  nickname: string;

  constructor(
    private route: ActivatedRoute
    ){
    this.nickname = window.localStorage.getItem("currentUser");
    this.topic = this.route.snapshot.params.name;
  }
}
