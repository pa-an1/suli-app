import React from 'react';
import { CameraRoll, ActivityIndicator, Text, View, Button } from 'react-native';
import { StyleSheet } from 'react-native';

import ImageBrowser from './ImageBrowser';
import { httpPostFormData } from './services/http-requests';
import config from './config';

const READY = 0;
const LOADING = 1;
const ERROR = 2
const SUCCESS = 3

export default class App extends React.Component {
  state = {
    errMsg: '',
    status: READY,
  }

  _formData = (uri) => {
    return {
      uri,
      type: 'image/jpeg',
    }
  }

  _uploadImage = (photos) => {
    const formData = new FormData();
    for (let i = 0; i < photos.length; i++) {
      const uri = photos[ i ].uri || photos[ i ].file;
      formData.append('upload[]', this._formData(uri), i + '.jpg');
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
        const urls = result.links.split(',');
        const promises = [];
        for (var i = 0; i < urls.length; i++) {
          promises.push(CameraRoll.saveToCameraRoll(config.SERVER_URL + urls[ i ], 'photo'));
        }
        return Promise.all(promises);
      })
      .then(() => {
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
        body = <Text>{this.state.errMsg}</Text>
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
