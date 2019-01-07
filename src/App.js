import React, { Component } from 'react';
import Camera from 'react-camera';
import vision from "react-cloud-vision-api";

vision.init({ auth: 'AIzaSyCCkgum6iXGrPShHnahkr9sEclHqVwjPjI'})

export default class App extends Component {

  state = { mediaStream: MediaStream, frameRate: 0, leftEyeX: 0, leftEyeY: 0, rightEyeX: 0, rightEyeY: 0, positions: [] };

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
      let aaaa = res.responses[0].faceAnnotations[0].landmarks.map(elem => {
        return elem.position
      })
      console.log(aaaa);
      let leftEyePosition = res.responses[0].faceAnnotations[0].landmarks[0].position
      let rightEyePosition = res.responses[0].faceAnnotations[0].landmarks[1].position

      let leftEyeX = JSON.stringify(leftEyePosition.x)
      let leftEyeY = JSON.stringify(leftEyePosition.y)
      let rightEyeX = JSON.stringify(rightEyePosition.x)
      let rightEyeY = JSON.stringify(rightEyePosition.y)

      console.log(leftEyeX)
      console.log(leftEyeY)
      
      this.setState({leftEyeX: leftEyeX, leftEyeY: leftEyeY, rightEyeX: rightEyeX, rightEyeY: rightEyeY, positions: aaaa})
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
        <Canvas leftEyeX={this.state.leftEyeX} leftEyeY={this.state.leftEyeY} rightEyeX={this.state.rightEyeX} rightEyeY={this.state.rightEyeY} positions={this.state.positions}/>
      </div>
    )
  }
}

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
    // this.drawPoints(props)
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
    this.ctx.strokeStyle = "lightgreen"
    this.ctx.arc(x, y, 1, 0, 2 * Math.PI, true);
    this.ctx.stroke();
  }

  render() {
    return <canvas style={style.canvas} ref="canvas" width={640} height={480}></canvas>;
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