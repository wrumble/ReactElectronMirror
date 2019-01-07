import React, { Component } from 'react';
import Camera from 'react-camera';
import vision from "react-cloud-vision-api";

vision.init({ auth: 'AIzaSyCCkgum6iXGrPShHnahkr9sEclHqVwjPjI'})

export default class App extends Component {

  state = { mediaStream: MediaStream, frameRate: 0, positions: [] };

  constructor(props) {
    super(props);
    this.uploadFrame = this.uploadFrame.bind(this);
    this.frameRate = 0;
  }

  componentDidMount() {
    this.setMediaStreamAndFrameRate()
    this.beginImageUpload()
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  setMediaStreamAndFrameRate = () => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({video: true})
      .then(mediaStream => {
        let mediaStreamTrack = mediaStream.getVideoTracks()[0]
        let frameRate = mediaStreamTrack.getSettings().frameRate
        this.setState({ mediaStream: mediaStream, frameRate: frameRate })
      })
    }
  }

  beginImageUpload = () => {
    let milliSeconds = 1000/this.state.frameRate
    this.uploadImageEveryNumberOf(milliSeconds)
  }

  uploadImageEveryNumberOf = (milliSeconds) => {
    this.interval = setInterval(() => {
      this.uploadFrame()
    }, milliSeconds);
  }

  uploadFrame = () => {
    this.grabFrame()
    .then((bitmapImage) => {
      let base64Image = this.imageAsBase64(bitmapImage)
      this.uploadToVisionAPI(base64Image)
    }).catch((error) => {
      console.log('grabFrame() error: ', error)
    });
  }

  grabFrame = () => {
    let mediaStreamTrack = this.state.mediaStream.getVideoTracks()[0];
    let imageCapture = new window.ImageCapture(mediaStreamTrack);

    return imageCapture.grabFrame();
  }

  imageAsBase64 = image => {
    var canvas = document.createElement("canvas")
    canvas.width = image.width;
    canvas.height = image.height;
    
    let context = canvas.getContext("2d")
    context.drawImage(image, 0, 0);

    return canvas.toDataURL("image/png", 0.5)
  }

  uploadToVisionAPI = base64Image => {
    let request = this.createRequestFromImage(base64Image)

    vision.annotate(request)
    .then((res) => {
      let positions = res.responses[0].faceAnnotations[0].landmarks.map(elem => {
        return elem.position
      })
      
      this.setState({positions: positions})
    })
    .catch((error) => {
      console.log(`Error: ${error.message}`)
    });
  }

  createRequestFromImage = base64Image => {
    return new vision.Request({
      image: new vision.Image({
        base64: base64Image,
      }),
      features: [ new vision.Feature('FACE_DETECTION', 4) ]
    })
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
        <Canvas positions={this.state.positions}/>
      </div>
    )
  }
}

const style = {
  canvas: {
    position: 'absolute'
  },
  preview: {
    position: 'absolute',
    width: 640,
    height: 480
  }
};

class Canvas extends React.Component {
  constructor() {
    super();
    this.ctx = null;
  }
  componentDidMount() {
    this.ctx = this.refs.canvas.getContext("2d")
  }

  componentWillReceiveProps(props) {
    this.ctx.clearRect(0,0,this.refs.canvas.width, this.refs.canvas.height);

    props.positions.forEach(position => {
      this.point(position.x, position.y);
    })
  }

  drawPoints = (props) => {
    this.point(props.leftEyeX, props.leftEyeY)
    this.point(props.rightEyeX, props.rightEyeY)
  }

  point = (x, y) => {
    this.ctx.beginPath();
    this.ctx.strokeStyle = "red"
    this.ctx.arc(x, y, 1, 0, 2 * Math.PI, true);
    this.ctx.stroke();
  }

  render() {
    return <canvas style={style.canvas} ref="canvas" width={640} height={480}></canvas>;
  }
}