import React from 'react';
import { StyleSheet, Text, View, CameraRoll, FlatList, Dimensions, Button } from 'react-native';
import PropTypes from 'prop-types';

import ImageTile from './ImageTile';

const { width } = Dimensions.get('window')

export default class ImageBrowser extends React.Component {
  static propTypes = {
    max: PropTypes.number.isRequired,
    callback: PropTypes.func.isRequired,
  };

  state = {
    photos: [],
    selected: [],
    after: null,
    has_next_page: true,
  }

  componentDidMount() {
    this.getPhotos()
  }

  selectImage = (i) => {
    const { selected } = this.state;
    const position = selected.indexOf(i);
    let newSelected = [];
    if (position !== -1) {
      newSelected = [
        ...selected.slice(0, position),
        ...selected.slice(position + 1, selected.length),
      ];
    } else {
      newSelected = [ ...selected, i ];
    }

    if (newSelected.length > this.props.max) {
      return;
    }
    this.setState({ selected: newSelected });
  }

  getPhotos = () => {
    let params = { first: 50, assetType: 'Photos', base64: true };
    if (this.state.after) params.after = this.state.after
    if (!this.state.has_next_page) return
    CameraRoll
      .getPhotos(params)
      .then(this.processPhotos)
  }

  processPhotos = (r) => {
    if (this.state.after === r.page_info.end_cursor) return;
    let uris = r.edges.map(i=> i.node).map(i=> i.image).map(i=>i.uri)
    this.setState({
      photos: [ ...this.state.photos, ...uris ],
      after: r.page_info.end_cursor,
      has_next_page: r.page_info.has_next_page,
    });
  }

  getItemLayout = (data,index) => {
    let length = width / 4;
    return { length, offset: length * index, index }
  }

  prepareCallback() {
    let { selected, photos } = this.state;
    let selectedPhotos = photos.filter((item, index) => {
      return(selected.indexOf(index) !== -1)
    });
    selectedPhotos.sort((a, b) => {
      const indexA = photos.indexOf(a);
      const indexB = photos.indexOf(b);
      return selected.indexOf(indexA) - selected.indexOf(indexB);
    })
    this.props.callback(selectedPhotos)
  }

  renderHeader = () => {
    let selectedCount = this.state.selected.length;
    let headerText = selectedCount + ' Selected';
    if (selectedCount === this.props.max) headerText = headerText + ' (Max)';
    return (
      <View style={styles.header}>
        <Text>{headerText}</Text>
        <Button
          title="Choose"
          onPress={() => this.prepareCallback()}
        />
      </View>
    )
  }
  renderImageTile = ({ item, index }) => {
    let selected = this.state.selected.indexOf(index) !== -1;
    return(
      <ImageTile
        item={item}
        index={index}
        stt={this.state.selected.indexOf(index)}
        selected={selected}
        selectImage={this.selectImage}
      />
    )
  }
  renderImages() {
    return(
      <FlatList
        data={this.state.photos}
        numColumns={4}
        renderItem={this.renderImageTile}
        keyExtractor={(_,index) => index}
        onEndReached={()=> {this.getPhotos()}}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<Text>Loading...</Text>}
        initialNumToRender={24}
        getItemLayout={this.getItemLayout}
      />
    )
  }

  render() {
    return (
      <View style={styles.container}>
        {this.renderHeader()}
        {this.renderImages()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 50,
    width: width,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 20,
  },
})
