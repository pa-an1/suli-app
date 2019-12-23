import React from 'react';
import { TextInput, View, Button, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';

import ImageBrowser from './ImageBrowser';
import ImageCapture from './ImageCapture';

async function getPermission() {
  const results = await Promise.all([
    Permissions.askAsync(Permissions.CAMERA),
    Permissions.askAsync(Permissions.CAMERA_ROLL),
  ]);
  if (results.some(({ status }) => status !== 'granted')) {
    alert('Need CAMERA and CAMERA_ROLL Permission.');
    return
  }
}

export default class App extends React.Component {
  state = {
    list: [],
    mode: 'price',
    price: '100',
    running: false,
    xPercent: '20',
    yPercent: '40',
  }
  priceInput = React.createRef();

  componentWillMount() {
    getPermission();
  }

  _handleSendPress = async () => {
    const { list } = this.state;
    if (list.length === 0) {
      Alert.alert('Nhấn vào hình để chọn nhé');
      return;
    }
    this.setState({ running: true });
  }

  _handleOnPressItem = (uri) => {
    const { list } = this.state
    const index = list.indexOf(uri);
    if (index !== -1) {
      this.setState({
        list: [
          ...list.slice(0, index),
          ...list.slice(index + 1, list.length),
        ],
      })
    }
  }

  _handleOnPressAddItem = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.cancelled) {
      this.setState({
        list: [ ...this.state.list, result.uri ],
      })
    }
  }

  _handleRefreshPress = () => {
    this.setState({
      list: [],
    })
  }

  _handleOnDone = () => {
    this.setState({ list: [], running: false });
  }

  render() {
    const { list, mode, price, running, xPercent, yPercent } = this.state;
    if (running) {
      return <ImageCapture
        ref={ele => {this.imgCapture = ele}}
        list={list}
        drawMode={mode}
        price={price}
        xPercent={xPercent}
        yPercent={yPercent}
        onDone={this._handleOnDone}
      />
    }
    return (
      <View style={styles.container}>
        <View style={{ height: Constants.statusBarHeight }}></View>
        <View style={styles.modeBar}>
          <Button
            title='Đánh số'
            disabled={mode === 'mark'}
            onPress={() => this.setState({ mode: 'mark', xPercent: '10' })}
          />
          <Button
            title='Đánh giá tiền'
            disabled={mode === 'price'}
            onPress={() => {
              this.priceInput.current.focus();
              this.setState({ mode: 'price', xPercent: '20' })}
            }
          />
          <TextInput
            ref={this.priceInput}
            style={[ styles.input, { opacity: mode === 'price' ? 1 : 0 } ]}
            value={price}
            onChangeText={value => this.setState({ price: value })}
          />
        </View>
        <View style={styles.modeBar}>
          <TextInput
            style={styles.input}
            value={xPercent}
            onChangeText={value => this.setState({ xPercent: value })}
          />
          <TextInput
            style={styles.input}
            value={yPercent}
            onChangeText={value => this.setState({ yPercent: value })}
          />
        </View>
        <View style={{ flex: 1, width: '100%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button
              title="Refresh"
              onPress={this._handleRefreshPress}
            />
            <Button
              title="Gửi"
              onPress={this._handleSendPress}
            />
          </View>
          <ImageBrowser
            list={this.state.list}
            onPressItem={this._handleOnPressItem}
            onPressAddItem={this._handleOnPressAddItem}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeBar: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  input: {
    flex: 1,
    height: 50,
    marginHorizontal: 10,
    padding: 5,
    fontSize: 20,
    backgroundColor: 'gray',
  }
});
