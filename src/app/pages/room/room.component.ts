import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html'
})
export class RoomComponent implements OnInit {
  @ViewChild('localVideo')
  _localVideo: ElementRef;

  @ViewChild('remoteVideo')
  _remoteVideo: ElementRef;

  startButtonDisabled: boolean;
  callButtonDisabled: boolean;
  hangupButtonDisabled: boolean;

  private startTime: number;
  private localStream: MediaStream;
  private remoteStream: MediaStream;
  private pc1: RTCPeerConnection;
  private pc2: RTCPeerConnection;
  private offerOptions: RTCOfferOptions;

  constructor() { }

  get localVideo(): HTMLVideoElement {
    return this._localVideo ? this._localVideo.nativeElement : null;
  }

  get remoteVideo(): HTMLVideoElement {
    return this._remoteVideo ? this._remoteVideo.nativeElement : null;
  }

  ngOnInit(): void {
    this.resetButton();
    this.offerOptions = {
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 1
    };
  }

  start() {
    this.trace('Requesting local stream');
    this.startButtonDisabled = true;
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true
    })
      .then(stream => {
        this.trace('Received local stream');
        this.localVideo.srcObject = stream;
        this.localStream = stream;
        this.callButtonDisabled = false;
      })
      .catch(function (e) {
        this.resetButton();
        alert('getUserMedia() error: ' + e.name);
      });
  }

  call() {
    this.callButtonDisabled = true;
    this.hangupButtonDisabled = false;
    this.trace('Starting call');
    // const videoTracks = this.localStream.getVideoTracks();
    // const audioTracks = this.localStream.getAudioTracks();
    // if (videoTracks.length > 0) {
    //   this.trace('Using video device: ' + videoTracks[0].label);
    // }
    // if (audioTracks.length > 0) {
    //   this.trace('Using audio device: ' + audioTracks[0].label);
    // }
    const servers = null;
    this.pc1 = new RTCPeerConnection(servers);
    this.trace('Created local peer connection object pc1');
    this.pc1.onicecandidate = (e) => {
      this.onIceCandidate(this.pc1, e);
    };
    this.pc2 = new RTCPeerConnection(servers);
    this.trace('Created remote peer connection object pc2');
    this.pc2.onicecandidate = (e) => {
      this.onIceCandidate(this.pc2, e);
    };
    // this.pc1.oniceconnectionstatechange = (e) => {
    //   this.onIceStateChange(this.pc1, e);
    // };
    // this.pc2.oniceconnectionstatechange = (e) => {
    //   this.onIceStateChange(this.pc2, e);
    // };
    this.pc2.onaddstream = (e) => this.gotRemoteStream(e);

    this.pc1.addStream(this.localStream);
    this.trace('Added local stream to pc1');

    this.trace('pc1 createOffer start');
    this.pc1.createOffer(
      (desc) => this.onCreateOfferSuccess(desc),
      (err) => this.onCreateSessionDescriptionError(err),
      this.offerOptions);
  }

  private hangup() {
    this.trace('Ending call');
    this.pc1.close();
    this.pc2.close();
    this.pc1 = null;
    this.pc2 = null;
    this.resetButton();
  }

  private onCreateOfferSuccess(desc: RTCSessionDescription) {
    this.trace('Offer from pc1\n' + desc.sdp);
    this.trace('pc1 setLocalDescription start');
    this.pc1.setLocalDescription(desc)
      .then(() => this.onSetLocalSuccess(this.pc1))
      .catch((err) => this.onSetSessionDescriptionError(err));
    this.trace('pc2 setRemoteDescription start');
    this.pc2.setRemoteDescription(desc)
      .then(() => this.onSetRemoteSuccess(this.pc2))
      .catch((err) => this.onSetSessionDescriptionError(err));
    this.trace('pc2 createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    this.pc2.createAnswer()
      .then((aDesc) => this.onCreateAnswerSuccess(aDesc))
      .catch((err) => this.onCreateSessionDescriptionError(err));
  }

  private onSetLocalSuccess(pc: RTCPeerConnection) {
    this.trace(this.getName(pc) + ' setLocalDescription complete');
  }

  private onSetRemoteSuccess(pc: RTCPeerConnection) {
    this.trace(this.getName(pc) + ' setRemoteDescription complete');
  }

  private onCreateAnswerSuccess(desc: RTCSessionDescription) {
    this.trace('Answer from pc2:\n' + desc.sdp);
    this.trace('pc2 setLocalDescription start');
    this.pc2.setLocalDescription(desc)
      .then(() => this.onSetLocalSuccess(this.pc2))
      .catch((err) => this.onSetSessionDescriptionError(err));
    this.trace('pc1 setRemoteDescription start');
    this.pc1.setRemoteDescription(desc)
      .then(() => this.onSetLocalSuccess(this.pc1))
      .catch((err) => this.onSetSessionDescriptionError(err));
  }

  private onSetSessionDescriptionError(error) {
    this.trace('Failed to set session description: ' + error.toString());
  }

  private onCreateSessionDescriptionError(error: DOMError) {
    this.trace('Failed to create session description: ' + error.toString());
  }

  private getName(pc: RTCPeerConnection) {
    return (pc === this.pc1) ? 'pc1' : 'pc2';
  }

  private getOtherPc(pc: RTCPeerConnection) {
    return (pc === this.pc1) ? this.pc2 : this.pc1;
  }

  private onIceStateChange(pc: RTCPeerConnection, e: Event) {
    if (pc) {
      this.trace(this.getName(pc) + ' ICE state: ' + pc.iceConnectionState);
    }
  }

  private gotRemoteStream(e: MediaStreamEvent) {
    this.remoteVideo.srcObject = e.stream;
  }

  private trace(text: string): void {
    if (text[text.length - 1] === '\n') {
      text = text.substring(0, text.length - 1);
    }

    console.log(text);
  }

  private resetButton() {
    this.startButtonDisabled = false;
    this.callButtonDisabled = true;
    this.hangupButtonDisabled = true;
  }

  private onIceCandidate(pc: RTCPeerConnection, e: RTCPeerConnectionIceEvent) {
    if (!e.candidate) {
      return;
    }

    this.getOtherPc(pc).addIceCandidate(new RTCIceCandidate(e.candidate))
      .then(() => this.trace(this.getName(pc) + ' addIceCandidate success'))
      .catch((err) => this.trace(this.getName(pc) + ' failed to add ICE Candidate: ' + err.toString()));
  }

}
