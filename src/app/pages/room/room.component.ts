import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html'
})
export class RoomComponent {

  topic: string;

  constructor(
    private route: ActivatedRoute
    ){
    this.topic = this.route.snapshot.params.name;
  }
}
