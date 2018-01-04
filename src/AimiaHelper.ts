declare var TextDecoder: any;
import * as $ from 'jquery'
import { createChromeStore } from './chromeStore';
import { helperReducer, ActionTypes } from './reducers';
import { AimiaState, AimiaConfig } from './base';


const watchRequest = (config: AimiaConfig, store: any) => {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    detail => {
      let authHeader = detail.requestHeaders && detail.requestHeaders.filter(x => x.name == "Authorization")[0];
      if (authHeader && detail.requestHeaders.filter(x => x.name === 'X-AMH').length === 0) {

        const urlBase = detail.url.match(/.*\/api\/v1/)[0];

        let header: any = {};
        let except = ["Origin", "User-Agent", "Referer", "Accept-Encoding"]
        detail.requestHeaders.filter(x => except.indexOf(x.name) === -1).forEach(h => {
          header[h.name] = h.value;
        })
        header['X-AMH'] = "1"
        store.dispatch({ type: ActionTypes.UpdateHeader, header, urlBase })
      }
    },
    { urls: config.filterUrls },
    ['blocking', 'requestHeaders']
  );

  chrome.webRequest.onBeforeRequest.addListener(
    detail => {
      config.requests.forEach(req => {

        if (detail.url.indexOf('?amh=1') === -1 && detail.requestBody && detail.url.match(req.url)) {

          let body = new TextDecoder('utf-8').decode(detail.requestBody.raw[0].bytes);
          let url = detail.url.match(req.url)[0];
          store.dispatch({ type: ActionTypes.UpdateRequestBody, reqBody: body, url: `${url}?amh=1`, reqName: req.name })
        }
      });
    },
    { urls: config.filterUrls },
    ['blocking', 'requestBody']
  );
}

export const startAimiaHelper = async () => {
  let config:AimiaConfig = await $.getJSON('/config.json')
  let state: AimiaState = {
    header: null,
    urlBase: null,
    tasks: config.tasks
  }

  chrome.storage.local.remove('storeReducerIndex');
  createChromeStore(helperReducer, state).then(store => {
    watchRequest(config,store);
  });
}
