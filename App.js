import React from 'react';
import ImageBrowser from './ImageBrowser';

export default class App extends React.Component {
  imageBrowserCallback = (callback) => {
    callback.then((photos) => {
      console.log(photos)
    }).catch((e) => console.log(e))
  }

  render() {
    return <ImageBrowser max={9} callback={this.imageBrowserCallback}/>;
  }
}
