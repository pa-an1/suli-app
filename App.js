import React from 'react';
import { CameraRoll, ActivityIndicator, Text, View, Button, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native';
import { Notifications, Permissions } from 'expo';

import ImageBrowser from './ImageBrowser';
import { httpPostFormData } from './services/http-requests';
import config from './config';

const READY = 0;
const LOADING = 1;
const ERROR = 2;
const SUCCESS = 3;

async function getiOSNotificationPermission() {
  const { status } = await Permissions.getAsync(
    Permissions.NOTIFICATIONS
  );
  if (status !== 'granted') {
    await Permissions.askAsync(Permissions.NOTIFICATIONS);
  }
}

export default class App extends React.Component {
  state = {
    errMsg: '',
    status: READY,
  }

  componentWillMount() {
    getiOSNotificationPermission();
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

  _formData = (uri, stt) => {
    return {
      uri,
      type: 'image/jpeg',
      name: stt + '.jpg',
    }
  }

  _uploadImage = (photos) => {
    const formData = new FormData();
    for (let i = 0; i < photos.length; i++) {
      const uri = photos[ i ].uri || photos[ i ].file;
      const stt = i + 1;
      formData.append('upload[]', this._formData(uri, stt), stt + '.jpg');
    }
    return httpPostFormData(formData)
  };

  _imageBrowserCallback = (callback) => {
    callback
      .then(photos => {
        this.setState({ status: LOADING });
        return this._uploadImage(photos);
      })
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
        this.setState({ status: SUCCESS });
      })
      .catch((e) => {
        this.setState({
          errMsg: JSON.stringify(e),
          status: ERROR,
        });
      })
  }

  render() {
    let body;
    switch (this.state.status) {
      case READY:
        body = <ImageBrowser max={9} callback={this._imageBrowserCallback}/>;
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
