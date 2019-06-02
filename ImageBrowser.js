import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

const TYPE_NO_ITEM = 0;
const TYPE_ADD_ITEM = 1;

class Item extends PureComponent {
  static propTypes = {
    uri: PropTypes.string.isRequired,
    onPressItem: PropTypes.func.isRequired,
    stt: PropTypes.number.isRequired,
  }

  _onPress = () => {
    this.props.onPressItem(this.props.uri);
  };

  render() {
    const { uri, stt } = this.props;
    return (
      <TouchableOpacity
        style={[ styles.item, styles.itemBorder ]}
        onPress={this._onPress}
      >
        <Image
          source={{ uri }}
          style={{ flex: 1 }}
        />
        <View style={StyleSheet.absoluteFill}>
          <Text style={styles.numberText}>{stt}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class AddItem extends PureComponent {
  static propTypes = {
    onPress: PropTypes.func.isRequired,
  }

  render() {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={this.props.onPress}
      >
        <View style={[ styles.addBtn, styles.center ]}>
          <Feather name="plus" size={50} color={'black'} />
        </View>
      </TouchableOpacity>
    );
  }
}

class NoItem extends PureComponent {
  render() {
    return (
      <View style={styles.item}></View>
    );
  }
}

export default class ImageBrowser extends PureComponent {
  static propTypes = {
    list: PropTypes.array.isRequired,
    onPressAddItem: PropTypes.func.isRequired,
    onPressItem: PropTypes.func.isRequired,
  };

  _keyExtractor = (item) => item.uri;

  _renderItem = ({ item }) => {
    switch (item.type) {
      case TYPE_NO_ITEM:
        return <NoItem />;
      case TYPE_ADD_ITEM:
        return <AddItem
          onPress={this.props.onPressAddItem}
        />;
      default:
        return <Item
          onPressItem={this.props.onPressItem}
          uri={item.uri}
          stt={item.stt}
        />;
    }
  };

  render() {
    const { list } = this.props;
    const listItem = [ { type: TYPE_ADD_ITEM, uri: 'add-item' } ];
    for (let i = 0; i < list.length; i++) {
      listItem.push({ uri: list[ i ], stt: (i + 1) });
    }
    for (let i = 1; i <= (listItem.length % 3); i++) {
      listItem.push({ type: TYPE_NO_ITEM, uri: 'no-item' });
    }
    return (
      <FlatList
        numColumns={3}
        data={listItem}
        keyExtractor={this._keyExtractor}
        renderItem={this._renderItem}
        style={styles.flatList}
      />
    );
  }
}

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },
  item: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flex: 1,
    borderWidth: 3,
    borderColor: 'black',
    borderStyle: 'dashed',
  },
  itemBorder: {
    borderWidth: 1,
    borderColor: 'black',
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
});
