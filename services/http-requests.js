import config from '../config';

const _http = ({ method, headers, data }) => {
  // eslint-disable-next-line
  console.log(data || '');
  headers = headers || {};
  headers[ 'pragma' ] = 'no-cache';
  headers[ 'cache-control' ] = 'no-cache';

  const options = {
    method,
    headers,
    body: data,
  };

  const path = data._parts[data._parts.length - 1][0] === 'price' ? 'upload-price' : 'upload';

  return fetch(config.SERVER_URL + path, options)
    .then((res) => res.json())
    .then((data) => {
      // eslint-disable-next-line
      console.log('response: ', data);
      if (data.error) {
        return Promise.reject(data.error);
      }
      return data;
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

export const httpPostFormData = (formData) => {
  const headers = {
    'Content-Type': 'multipart/form-data',
  };
  return _http({
    method: 'POST',
    headers,
    data: formData,
  });
};
