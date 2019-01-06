import React, { Component } from 'react';
import Camera from 'react-camera';
import vision from "react-cloud-vision-api";

var base64Img = require('base64-img');

vision.init({ auth: 'aca176a6d6b1d72e386cd68a14b77ec4c3262944'})

export default class App extends Component {

  state = { mediaStream: MediaStream, frameRate: 0 };

  constructor(props) {
    super(props);
    this.uploadFrame = this.uploadFrame.bind(this);
    this.frameRate = 0;
  }

  // uploadFrame() {
  //   this.camera.capture()
  //   .then(blob => {
  //     console.log(`Blob: ${blob}`)
  //     this.img.src = URL.createObjectURL(blob);
  //     this.uploadToVisionAPI(this.img.src)
  //     this.img.onload = () => {  URL.revokeObjectURL(this.src) }
  //   })
  // }

  uploadFrame() {
    this.grabFrame()
    .then(function(bitmapImage) {
      var canvas = document.createElement("canvas")
      canvas.width = bitmapImage.width;
      canvas.height = bitmapImage.height;
      
      let context = canvas.getContext("2d")
      context.drawImage(bitmapImage, 0, 0);

      let base64Image = canvas.toDataURL("image/png").split(",")[1]
      console.log(base64Image)
      const request = new vision.Request({
        image: new vision.Image({
          base64: base64Image,
        }),
        features: [ new vision.Feature('FACE_DETECTION') ]
      })
  
      vision.annotate(request)
      .then((response) => {
        console.log(`Response: ${response}`)
      })
      .catch((error) => {
        console.log(`Error: ${error}`)
      });
    }).catch((error) => {
      console.log('grabFrame() error: ', error)
    });
  }

  grabFrame() {
    let mediaStreamTrack = this.state.mediaStream.getVideoTracks()[0];
    let imageCapture = new window.ImageCapture(mediaStreamTrack);

    return imageCapture.grabFrame();
  }

  imageAsBase64(image) {
    var canvas = document.createElement("canvas")
    canvas.width = image.width;
    canvas.height = image.height;
    
    let context = canvas.getContext("2d")
    context.drawImage(image, 0, 0);

    return canvas.toDataURL("image/png", 0.5)
  }


  // imageAsBase64(img) {
  //   var reader = new FileReader();
  //   reader.onload = function (event) {
  //     let base64Image = event.target.result
  //     this.uploadToVisionAPI(base64Image)
  //   }
  //   reader.readAsDataURL(img);
  // }

  uploadToVisionAPI(base64Image) {
    const request = new vision.Request({
      image: new vision.Image({
        base64: base64Image,
      }),
      features: [ new vision.Feature('FACE_DETECTION') ]
    })

    vision.annotate(request)
    .then((response) => {
      console.log(`Response: ${response}`)
    })
    .catch((error) => {
      console.log(`Error: ${error}`)
    });
  }

  componentDidMount() {
    this.setMediaStreamAndFrameRate()
    this.beginImageUpload()
  }

  setMediaStreamAndFrameRate() {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({video: true})
      .then(mediaStream => {
        let mediaStreamTrack = mediaStream.getVideoTracks()[0]
        let frameRate = mediaStreamTrack.getSettings().frameRate
        this.setState({ mediaStream: mediaStream, frameRate: frameRate })
      })
    }
  }

  beginImageUpload() {
    let milliSeconds = 1000/this.state.frameRate
    this.uploadImageEveryNumberOf(milliSeconds)
  }

  uploadImageEveryNumberOf(milliSeconds) {
    this.interval = setInterval(() => {
      this.uploadFrame()
    }, 3000);
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    return (
      <div style={style.container}>
        <Camera
          style={style.preview}
          ref={(cam) => {
            this.camera = cam
          }}
        >
        </Camera>
        <img
          ref={(img) => {
            this.img = img;
          }}
        />
      </div>
    );
  }
}

const style = {
  preview: {
    position: 'relative',
  }
};