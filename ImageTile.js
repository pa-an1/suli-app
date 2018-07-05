import React from 'react';
import { Text, View, Dimensions, Image, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const { width } = Dimensions.get('window');

export default class ImageTile extends React.PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    item: PropTypes.string.isRequired,
    selected: PropTypes.bool.isRequired,
    selectImage: PropTypes.func.isRequired,
    stt: PropTypes.number.isRequired,
  };

  render() {
    let { item, index, selected, selectImage, stt } = this.props;
    if (!item) return null;
    return (
      <TouchableOpacity
        onPress={() => selectImage(index)}
      >
        <Image
          style={{ width: width / 4, height: width / 4 }}
          source={{ uri: item }}
        />
        {selected &&
          <View style={styles.numberWrapper}></View>
        }
        {selected &&
          <View style={StyleSheet.absoluteFill}>
            <Text style={styles.numberText}>{stt + 1}</Text>
          </View>
        }
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  numberWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    opacity: 0.5,
  },
  numberText: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'font',
    color: '#F8A1B9',
  },
})
