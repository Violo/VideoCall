import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html'
})
export class RoomComponent implements OnInit {

  @ViewChild('localVideo') _localVideo: ElementRef;
  topic: string;
  nickname: string;
  streamLocal: MediaStream;

  constructor(
    private route: ActivatedRoute
    ){
    this.nickname = window.localStorage.getItem("currentUser");
    this.topic = this.route.snapshot.params.name;
    this.localVideo;
  }

  get localVideo(): HTMLVideoElement{
    return this._localVideo ? this._localVideo.nativeElement : null;
  }

  getMedia(){
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true
    })
    .then((stream) => {
      this.localVideo.srcObject = stream;
      this.streamLocal = stream;
    })
  }

  ngOnInit(){
    this.getMedia();
  }

  ngOnDestroy(){
    const tracks = this.streamLocal.getTracks();
    tracks.forEach((t) => {
      this.streamLocal.removeTrack(t);
    });
    this.localVideo.srcObject = null;
  }
}
