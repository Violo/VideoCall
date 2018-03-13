import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html'
})
export class RoomComponent implements OnInit, OnDestroy {

  @ViewChild('localVideo') _localVideo: ElementRef;
  @ViewChild('remoteVideo') _remoteVideo: ElementRef;
  topic: string;
  nickname: string;
  streamLocal: MediaStream;
  streamRemote: MediaStream;
  private isChannelReady;
  private isInitiator;
  private isStarted;
  private sdpConstraints;
  private pcConfig;

  constructor(
    private route: ActivatedRoute
    ) {
    this.nickname = window.localStorage.getItem("currentUser");
    this.topic = this.route.snapshot.params.name;
  }

  get localVideo(): HTMLVideoElement{
    return this._localVideo ? this._localVideo.nativeElement : null;
  }

  get remoteVideo(): HTMLVideoElement{
    return this._remoteVideo ? this._remoteVideo.nativeElement : null;
  }

  getMedia() {
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
    .then((stream) => {
      this.localVideo.srcObject = stream;
      this.streamLocal = stream;
      this.localVideo.muted = true;
    });
  }

  ngOnInit() {
    this.isChannelReady = false;
    this.isInitiator = false;
    this.isStarted = false;
    this.sdpConstraints = {
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 1
    };

    this.pcConfig = {
      'iceServers': [{
         'urls': 'stun:stun.l.google.com:19302'
      }]
    };
    this.getMedia();
  }

  ngOnDestroy() {
    this.stopStream();
  }

  stopStream() {
    const tracks = this.streamLocal.getTracks();
    tracks.forEach((t) => {
      t.stop();
    });
    this.localVideo.srcObject = null;
  }

  toggleAudio() {
    const audioTrack = this.streamLocal.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
  }

  toggleVideo() {
    const videoTrack = this.streamLocal.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
  }
}
