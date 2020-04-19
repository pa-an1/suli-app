import React from 'react';
import { ActivityIndicator, Text, TextInput, View, Button, ScrollView, Alert, YellowBox } from 'react-native';
import { StyleSheet } from 'react-native';
import KeepAwake from 'expo-keep-awake';
import * as Font from 'expo-font';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import CameraRoll from "@react-native-community/cameraroll";
import AsyncStorage from '@react-native-community/async-storage';

import ImageBrowser from './ImageBrowser';
import { httpPostFormData } from './services/http-requests';
import config from './config';

const storeImageNumber = async (number) => {
  try {
    await AsyncStorage.setItem('@image', number)
  } catch (e) {
    Alert.alert(JSON.stringify(e))
  }
}

const getImageNumber = async () => {
  try {
    const value = await AsyncStorage.getItem('@image')
    return value
  } catch(e) {
    Alert.alert(JSON.stringify(e))
  }
}

YellowBox.ignoreWarnings([
  'The KeepAwake component has been deprecated',
]);

const READY = 0;
const LOADING = 1;
const ERROR = 2;
const SUCCESS = 3;

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
    errMsg: '',
    status: READY,
    list: [],
    mode: 'mark',
    price: '100',
  }
  priceInput = React.createRef();

  componentWillMount() {
    getPermission();
    fetch(config.SERVER_URL + 'mark');
    Font.loadAsync({
      font: require('./assets/font.ttf'),
    });
  }

  _uploadImage = (uris) => {
    const { mode, price } = this.state;
    const formData = new FormData();
    for (let i = 0; i < uris.length; i++) {
      const stt = i + 1;
      const data = {
        uri: uris[ i ],
        type: 'image/jpeg',
        name: stt + '.jpg',
      };
      formData.append('upload[]', data, stt + '.jpg');
      if (mode === 'price') {
        formData.append('price', price);
      }
    }
    return httpPostFormData(formData)
  };

  _handleSendPress = () => {
    const { list } = this.state;
    if (list.length === 0) {
      Alert.alert('Nhấn vào hình để chọn nhé');
      return;
    }
    storeImageNumber(list.length.toString())
    this.setState({ status: LOADING });
    this._uploadImage(list)
      .then(result => {
        if (result.links === '') {
          return Promise.reject('No Result');
        }
        const urls = result.links.split(',');
        const promises = [];
        for (var i = 0; i < urls.length; i++) {
          promises.push(CameraRoll.saveToCameraRoll(config.SERVER_URL + urls[ i ], 'photo'));
        }
        return Promise.all(promises);
      })
      .then(() => {
        this.setState({
          status: SUCCESS,
          list: [],
        });
      })
      .catch((e) => {
        this.setState({
          errMsg: JSON.stringify(e),
          status: ERROR,
        });
      })
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

  _handleDownloadPress = async () => {
    try {
      let imageNumber = await getImageNumber();
      if (!imageNumber) {
        Alert.alert('Không có hình ảnh ở lần gửi trước.');
        return
      }
      imageNumber = parseInt(imageNumber)
      const promises = [];
      this.setState({ status: LOADING });
      for (let i = 1; i <= imageNumber; i++) {
        promises.push(CameraRoll.saveToCameraRoll(`${config.SERVER_URL}output/do-mac-nha-${i}.jpg`, 'photo'));
      }
      await Promise.all(promises)
      Alert.alert('Đã tải xong.');
      this.setState({ status: SUCCESS });
    } catch (e) {
      Alert.alert('Không có hình ảnh ở lần gửi trước.');
      this.setState({ status: SUCCESS });
    }
  }

  render() {
    const { mode, price } = this.state;
    let body;
    switch (this.state.status) {
      case READY:
        body = (
          <View style={{ flex: 1, width: '100%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button
                title="Refresh"
                onPress={this._handleRefreshPress}
              />
              <Button
                title="Tải về lần trước"
                onPress={this._handleDownloadPress}
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
        );
        break;
      case LOADING:
        body = <ActivityIndicator />
        break;
      case ERROR:
        body = <ScrollView><Text>{this.state.errMsg}</Text></ScrollView>
        break;
      case SUCCESS:
        body = <Button
          title={'Tiếp tục'}
          onPress={() => {this.setState({ status: READY })}}
        />
        break;
      default:
        break;
    }

    return (
      <View style={styles.container}>
        <View style={{ height: Constants.statusBarHeight }}></View>
        <View style={styles.modeBar}>
          <Button
            title='Đánh số'
            disabled={mode === 'mark'}
            onPress={() => this.setState({ mode: 'mark' })}
          />
          <Button
            title='Đánh giá tiền'
            disabled={mode === 'price'}
            onPress={() => {
              this.priceInput.current.focus();
              this.setState({ mode: 'price' })}
            }
          />
          <TextInput
            ref={this.priceInput}
            style={[ styles.input, { opacity: mode === 'price' ? 1 : 0 } ]}
            value={price}
            onChangeText={value => this.setState({ price: value })}
          />
        </View>
        <KeepAwake />
        {body}
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
