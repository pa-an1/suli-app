import React, { Component } from 'react';
import { StyleSheet, Image, View, Platform } from 'react-native';
import ExpoTHREE, { THREE } from 'expo-three';
import GLView from './GLView';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

const localFont = require('./assets/font2.json')

function isLocalUri(uri) {
  if (Platform.OS === 'android' || !uri) {
    return true;
  }
  return uri.toLowerCase().startsWith('file:');
}

function sleep(ms) {
  return new Promise((res) => {
    setTimeout(res, ms);
  })
}

export default class ImageCapture extends Component {
  state = {
    mode: 'img',
    imageUri: '',
  }
  groupMesh = [];

  componentDidMount() {
    this._run();
  }

  _addBox = (xt, yt, w = 17, h = 7, r = 2) => {
    const x0 = xt + 6.7;
    const y0 = yt + 1.35;
    var materialPlane = new THREE.MeshBasicMaterial( {color: 0xe94368, side: THREE.DoubleSide} );

    var geometryPlane1 = new THREE.PlaneGeometry(w, h - 2 * r);
    var plane1 = new THREE.Mesh( geometryPlane1, materialPlane );
    plane1.position.set(x0, y0, 0);
    this.scene.add(plane1);
    this.groupMesh.push(plane1);

    var geometryPlane2 = new THREE.PlaneGeometry(w - 2 * r, h);
    var plane2 = new THREE.Mesh( geometryPlane2, materialPlane );
    plane2.position.set(x0, y0, 0);
    this.scene.add(plane2);
    this.groupMesh.push(plane2);

    const cpxs = [x0 - w / 2 + r, x0 + w / 2 - r, x0 + w / 2 - r, x0 - w / 2 + r];
    const cpys = [y0 + h / 2 - r, y0 + h / 2 - r, y0 - h / 2 + r, y0 - h / 2 + r];
    for (let i = 0; i < 4 ; i++) {
      const geometry = new THREE.CircleGeometry( r, 32 );
      const material = new THREE.MeshBasicMaterial( { color: 0xe94368 } );
      const circle = new THREE.Mesh( geometry, material );
      circle.position.set(cpxs[i], cpys[i], 0);
      this.scene.add(circle);
      this.groupMesh.push(circle);
    }
  }

  _setupBackground = async (uri, txt) => {
    for (let i = 0; i < this.groupMesh.length; i++) {
      this.scene.remove(this.groupMesh[i]);
    }
    const size = this.scene.sizeAt0;
    const texture = await ExpoTHREE.loadAsync(uri);

    const textureWidth = texture.image.width;
    const textureHeight = texture.image.height;
    let scaledWidth;
    let scaledHeight;
    if (size.width * textureHeight / textureWidth > size.height) {
      scaledWidth = size.height / textureHeight * textureWidth;
      scaledHeight = size.height;
    } else {
      scaledWidth = size.width;
      scaledHeight = size.width / textureWidth * textureHeight;
    }
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    const geometry = new THREE.PlaneGeometry(scaledWidth, scaledHeight, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const bg = new THREE.Mesh( geometry, material );
    this.scene.add(bg);
    this.groupMesh.push(bg);

    const xText = this.props.xPercent * scaledWidth / 100;
    const yText = -this.props.yPercent * scaledHeight / 100;
    const wText = txt.length <= 3 ? 10 : 17;
    this._addBox(xText + (txt.length <= 3 ? -3 : 0), yText, wText);

    const font = new THREE.FontLoader().parse(localFont)
    const textGeometry =  new THREE.TextGeometry(txt, { font, size: 3, height: 0 });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const text = new THREE.Mesh( textGeometry, textMaterial );
    text.position.set(xText, yText, 0);
    this.scene.add(text);
    this.groupMesh.push(text);
  };

  _onSetup = async ({ scene, camera }) => {
    this.scene = scene;
    this.camera = camera;
  };

  _takeImage = async () => {
    let uri = await captureRef(this.img, {
      format: 'png',
      quality: 1,
    });
    if (!isLocalUri(uri)) {
      uri = 'file://' + uri;
    }
    return uri;
  }
  
  _run = async () => {
    const { list, onDone, drawMode, price } = this.props;
    for (let i = 0; i < list.length; i++) {
      this.setState({ imageUri: list[i], mode: 'img' });
      await sleep(3000);
      const imgUri = await this._takeImage();
      this.setState({ mode: 'gl' });
      const text = drawMode === 'mark' ? `Hình ${i + 1}` : price;
      await this._setupBackground(imgUri, text);
      await sleep(3000);
      const glUri = await this.glView.takeSnapshotAsync();
      await MediaLibrary.saveToLibraryAsync(glUri);
    }
    onDone();
  }

  render() {
    const { mode, imageUri } = this.state;
    const imgZIndex = (mode === 'img' ? 1 : -1)
    return (
      <View style={{ flex: 1}}>
        {imageUri !== '' &&
          <Image
            ref={ele => {this.img = ele}}
            source={{ uri: imageUri }}
            style={{ ...StyleSheet.absoluteFill, zIndex: imgZIndex, resizeMode: 'contain', backgroundColor: 'white' }}
          />
        }
        <GLView
          ref={ele => {this.glView = ele}}
          onSetup={this._onSetup}
        />
      </View>
    )
  }
}

