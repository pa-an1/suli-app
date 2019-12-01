import React from 'react';
import { CameraRoll, ActivityIndicator, Text, View, Button, ScrollView, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import { Notifications } from 'expo';
import KeepAwake from 'expo-keep-awake';
import * as Font from 'expo-font';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';

import ImageBrowser from './ImageBrowser';
import { httpPostFormData } from './services/http-requests';
import config from './config';

const READY = 0;
const LOADING = 1;
const ERROR = 2;
const SUCCESS = 3;

async function getPermission() {
  const results = await Promise.all([
    Permissions.askAsync(Permissions.NOTIFICATIONS),
    Permissions.askAsync(Permissions.CAMERA),
    Permissions.askAsync(Permissions.CAMERA_ROLL),
  ]);
  if (results.some(({ status }) => status !== 'granted')) {
    alert('Need NOTIFICATIONS, CAMERA and CAMERA_ROLL Permission.');
    return
  }
}

export default class App extends React.Component {
  state = {
    errMsg: '',
    status: READY,
    list: [],
  }

  componentWillMount() {
    getPermission();
    fetch(config.SERVER_URL + 'mark');
    Font.loadAsync({
      font: require('./assets/font.ttf'),
    });
  }

  _pushNotification = () => {
    const localNotification = {
      title: 'Đánh số xong!',
      body: 'Đánh số cho hình xong rồi nhé, hình ở trong album đó hehe!!',
      android: { sound: true },
      ios: { sound: true },
    };
    Notifications.presentLocalNotificationAsync(localNotification);
  };

  _uploadImage = (uris) => {
    const formData = new FormData();
    for (let i = 0; i < uris.length; i++) {
      const stt = i + 1;
      const data = {
        uri: uris[ i ],
        type: 'image/jpeg',
        name: stt + '.jpg',
      };
      formData.append('upload[]', data, stt + '.jpg');
    }
    return httpPostFormData(formData)
  };

  _handleSendPress = () => {
    const { list } = this.state;
    if (list.length === 0) {
      Alert.alert('Nhấn vào hình để chọn nhé');
      return;
    }
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
        this._pushNotification();
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

  render() {
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
        <KeepAwake />
        {body}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
