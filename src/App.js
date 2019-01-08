import React, { Component } from 'react';
import FrameHandler from "./components/FrameHandler"
import ColorPicker from "./components/ColorPicker"

export default class App extends Component {
  state = { selectedColor: "red" }

  handleColorChange = (color) => {
    this.setState({selectedColor: color})
  }

  render() {
    return (
      <div>
        <FrameHandler pointColor={ this.state.selectedColor }/>
        <ColorPicker onColorChange={this.handleColorChange}/>
      </div>
    )
  }
}
