import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
const { width } = Dimensions.get('window')

class ImageTile extends React.PureComponent {
  render() {
    let { item, index, selected, selectImage, stt } = this.props;
    if (!item) return null;
    return (
      <TouchableOpacity
        onPress={() => selectImage(index)}
      >
        <Image
          style={{width: width/4, height: width/4}}
          source={{uri: item}}
        />
        {selected &&
          <Text>{stt}</Text>
        }
      </TouchableOpacity>
    )
  }
}
export default ImageTile;
