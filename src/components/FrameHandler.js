import React, { Component } from 'react';
import Camera from 'react-camera';
import Canvas from "./Canvas";
import vision from "react-cloud-vision-api";

vision.init({ auth: 'AIzaSyCCkgum6iXGrPShHnahkr9sEclHqVwjPjI'})

class FrameHandler extends React.Component {

  state = { mediaStream: MediaStream, frameRate: 0, positions: [], pointColor: "red" };

    constructor() {
        super();
        this.frameRate = 0;
    }

    componentDidMount() {
        this.setMediaStreamAndFrameRate()
        this.beginImageUpload()
    }
    
    componentWillUnmount() {
        clearInterval(this.interval)
    }
    
    componentWillReceiveProps(prevProps) {
        if (prevProps.pointColor !== this.props.pointColor) { 
            this.setState({ pointColor: prevProps.pointColor })
        }
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
            // let allPositions = res.responses[0].faceAnnotations.map(faceAnnotation => {
            //     faceAnnotations
            // }

            let positions = res.responses[0].faceAnnotations[0].landmarks.map(elem => {
                return elem.position
            })
            // let positions2 = res.responses[0].faceAnnotations[1].landmarks.map(elem => {
            //     return elem.position
            // })
            // let positionsArray = [...positions, ...positions2];
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
          <div >
            <Camera
              style={style.preview}
              ref={(cam) => {
                this.camera = cam
              }}
            >
            </Camera>
            <Canvas positions={this.state.positions} pointColor={ this.state.pointColor }/>
          </div>
        )
      }
}

const style = {
  preview: {
    position: 'absolute',
    width: 640,
    height: 480
  }
};

export default FrameHandler;