import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, OnDestroy {

  @ViewChild('localVideo') _localVideo: ElementRef;
  @ViewChild('remoteVideo') _remoteVideo: ElementRef;
  topic: string;
  nickname: string;

  private isChannelReady: boolean;
  private isInitiator: boolean;
  private isStarted: boolean;
  private pc: RTCPeerConnection;
  private localStream: MediaStream;
  private remoteStream: MediaStream;
  private turnReady;
  private pcConfig;
  private sdpConstraints: RTCOfferOptions;
  private socket: SocketIOClient.Socket;

  constructor(
    private route: ActivatedRoute
    ) { }

  get localVideo(): HTMLVideoElement{
    return this._localVideo ? this._localVideo.nativeElement : null;
  }

  get remoteVideo(): HTMLVideoElement{
    return this._remoteVideo ? this._remoteVideo.nativeElement : null;
  }

  initVideo() {
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
    .then(stream => {
      console.log('Received local stream');
      this.localVideo.srcObject = stream;
      this.localStream = stream;
      this.sendMessage('got user media');
      if (this.isInitiator) {
        this.maybeStart();
      }
    })
    .catch(function (e) {
      alert('getUserMedia() error: ' + e.name);
    });
  }

  ngOnInit() {
    this.nickname = window.localStorage.getItem('currentUser');
    this.topic = this.route.snapshot.params.name;

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

    this.initSocketConnection();
    this.initVideo();
  }

  ngOnDestroy() {
    this.stopStream();
    this.sendMessage('bye');
    this.socket.disconnect();
  }

  stopStream() {
    const tracks = this.localStream.getTracks();
    tracks.forEach((t) => {
      t.stop();
    });
    this.localVideo.srcObject = null;
  }

  toggleAudio() {
    const audioTrack = this.localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
  }

  toggleVideo() {
    const videoTrack = this.localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
  }

  private initSocketConnection() {
    this.socket = io.connect();
    this.socket.emit('create or join', this.topic);
    console.log('Attempted to create or  join room ' + this.topic);

    this.socket.on('created', (room, clientId) => {
      console.log('Created room ' + room);
      this.isInitiator = true;
    });

    this.socket.on('full', function(room) {
      console.log('Room ' + room + ' is full');
    });

    this.socket.on('join', (room) => {
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      this.isChannelReady = true;
    });

    this.socket.on('joined', (room, clientId) => {
      console.log('joined: ' + room);
      this.isChannelReady = true;
    });

    this.socket.on('message', (message) => {
      console.log('Client received message:' + message);
      if (message === 'got user media') {
        this.maybeStart();
      } else if (message.type === 'offer') {
        if (!this.isInitiator && !this.isStarted) {
          this.maybeStart();
        }
        this.pc.setRemoteDescription(new RTCSessionDescription(message));
        this.doAnswer();
      } else if (message.type === 'answer' && this.isStarted) {
        this.pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && this.isStarted) {
        const candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        this.pc.addIceCandidate(candidate);
      } else if (message === 'bye' && this.isStarted) {
        this.handleRemoteHangup();
      }
    });
  }

  private maybeStart() {
    console.log('>>>>>>> maybeStart() ', this.isStarted, this.localStream, this.isChannelReady);
    if (!this.isStarted && typeof this.localStream !== 'undefined' && this.isChannelReady) {
      console.log('>>>>>> creating peer connection');
      this.createPeerConnection();
      this.pc.addStream(this.localStream);
      this.isStarted = true;
      console.log('isInitiator', this.isInitiator);
      if (this.isInitiator) {
        this.doCall();
      }
    }
  }

  private doCall() {
    this.pc.createOffer()
      .then((sessionDescription) => {
        this.pc.setLocalDescription(sessionDescription);
        console.log('setLocalAndSendMessage sending message', sessionDescription);
        this.sendMessage(sessionDescription);
      }).catch((event) => {
        console.log('createOffer() error: ', event);
      });
  }

  private createPeerConnection() {
    try {
      this.pc = new RTCPeerConnection(null);
      this.pc.onicecandidate = this.handleIceCandidate.bind(this);
      this.pc.onaddstream = this.handleRemoteStreamAdded.bind(this);
      this.pc.onremovestream = this.handleRemoteStreamRemoved.bind(this);
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
  }

  private handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    this.remoteStream = event.stream;
    this.remoteVideo.srcObject = this.remoteStream;
  }

  private handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }

  private handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      this.sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  }

  private handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    this.isInitiator = false;
  }

  private stop() {
    this.isStarted = false;
    this.pc.close();
    this.pc = null;
  }

  private sendMessage(message) {
    this.socket.emit('message', message);
  }

  private doAnswer() {
    console.log('Sending answer to peer.');
    this.pc.createAnswer()
    .then((sessionDescription) => {
      // Set Opus as the preferred codec in SDP if Opus is present.
      //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
      this.pc.setLocalDescription(sessionDescription);
      console.log('setLocalAndSendMessage sending message', sessionDescription);
      this.sendMessage(sessionDescription);
    }, (error) => console.log('Failed to create session description: ' + error.toString()));
  }

}
