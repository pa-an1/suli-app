import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import ExpoTHREE, { THREE } from 'expo-three';
import { GLView } from 'expo-gl';

export default class CustomGLView extends Component {
  static propTypes = {
    onSetup: PropTypes.func.isRequired,
    update: PropTypes.func,
  };

  takeSnapshotAsync = async () => {
    const obj = await this.glView.takeSnapshotAsync();
    return obj.uri;
  }

  render() {
    return (
      <GLView
        ref={ele => {this.glView = ele}}
        style={{ flex: 1, backgroundColor: 'white' }}
        onContextCreate={this._onGLContextCreate}
      />
    );
  }

  _onGLContextCreate = async gl => {
    const { drawingBufferWidth: glWidth, drawingBufferHeight: glHeight } = gl;

    this.camera = new THREE.PerspectiveCamera( 45, glWidth / glHeight, 1, 500 );
    this.camera.position.set( 0, 0, 100 );
    this.camera.lookAt( 0, 0, 0 );

    this.scene = new THREE.Scene();
    const heightAt0 = Math.tan(Math.PI / 8) * 200;
    const widthAt0 = heightAt0 / glHeight * glWidth;
    this.scene.sizeAt0 = {
      width: widthAt0,
      height: heightAt0,
    };

    const renderer = new ExpoTHREE.Renderer({ gl });
    renderer.setSize(glWidth, glHeight);
    renderer.setClearColor(0x000000, 0);

    await this.props.onSetup({ scene: this.scene, camera: this.camera });

    const render = () => {
      requestAnimationFrame(render);
      if (this.props.update) {
        this.props.update();
      }
      renderer.render(this.scene, this.camera);
      gl.endFrameEXP();
    };

    render();
  };
}
