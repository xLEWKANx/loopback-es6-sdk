import HttpError from './HttpError';
import storage from './storage';

export const fetchJson = (url, options = {}) => {
  const requestHeaders =
    options.headers ||
    new Headers({
      Accept: 'application/json'
    });
  if (!(options && options.body && options.body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  let token = storage.load('lbtoken');

  if (token.id) {
    requestHeaders.set('Authorization', token.id);
  }

  return fetch(url, { ...options, headers: requestHeaders })
    .then(response =>
      response.text().then(text => ({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: text
      }))
    )
    .then(({ status, statusText, headers, body }) => {
      let json;
      try {
        json = JSON.parse(body);
      } catch (e) {
        // not json, no big deal
      }
      if (status < 200 || status >= 300) {
        return Promise.reject(
          new HttpError(
            (json && json.message) ||
              (json.error && json.error.message) ||
              statusText,
            status
          )
        );
      }
      return { status, headers, body, json };
    });
};

export const queryParams = data => {
  for (let key in data) {
    if (data[key] == undefined) {
      delete data[key];
    }
  }
  return (
    '?' +
    Object.keys(data)
      .map(key =>
        [key, JSON.stringify(data[key])].map(encodeURIComponent).join('=')
      )
      .join('&')
  );
};
