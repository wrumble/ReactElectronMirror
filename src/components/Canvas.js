import React from "react";

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
      this.ctx.strokeStyle = this.props.pointColor
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
    }
  }

  export default Canvas;