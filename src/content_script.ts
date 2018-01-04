import * as $ from 'jquery';

import { publishEvent, handleCommand, TaskRequestInfo } from './base';
import { createChromeStore } from './chromeStore';
import { ActionTypes } from './reducers';

createChromeStore().then(store => {

  async function sendRequestAsync(reqInfo: TaskRequestInfo) {
    for (let i = 0; i < reqInfo.repeat; i++) {
      for (let j = 0; j < reqInfo.requests.length; j++) {
        const req = reqInfo.requests[j];
        let rep = await $.ajax(req)
      }

      store.dispatch({
        type: ActionTypes.TaskUpdated,
        taskName: reqInfo.taskName,
        countDown: reqInfo.repeat - i - 1
      })
    }
  }


  handleCommand<TaskRequestInfo>("SendRequest", msg => {
    sendRequestAsync(msg)
      .then(() => {
        store.dispatch({
          type: ActionTypes.TaskFinished,
          taskName: msg.taskName
        })
      })
      .catch(err => {
        store.dispatch({
          type: ActionTypes.ErrorRaised,
          taskName: msg.taskName
        })
      })
  })
})





