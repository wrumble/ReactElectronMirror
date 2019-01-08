import React, { Component } from 'react';
import { SketchPicker } from 'react-color';

class ColorPicker extends React.Component {
    handleColorChange = (color) => {
      this.props.onColorChange(color.hex)
    }
  
    shouldComponentUpdate() {
      return false
    }
  
    render() {
      return (
        <div>
          <SketchPicker onChangeComplete={ this.handleColorChange }/>
        </div>
      )
    }
  } 
  
  export default ColorPicker;