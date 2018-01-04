import * as Redux from 'redux';
import { AimiaState, TaskRequestInfo, sendCommand, CommandReceiver, debug } from './base';

export enum ActionTypes {
  StartTask = 'StartTask',
  ChangeRepeat = 'ChangeRepeat',
  ErrorRaised = 'ErrorRaised',
  TaskFinished = 'TaskFinished',
  TaskUpdated = 'TaskUpdated',
  UpdateHeader = 'UpdateHeader',
  UpdateRequestBody = 'UpdateRequestBody'
}

export const taskReducer = (state: AimiaState, action: Redux.AnyAction): AimiaState => {
  switch (action.type) {
    case ActionTypes.StartTask:
      let task = state.tasks.filter(task => task.name === action.taskName)[0];
      if (task) {
        let settings = task.requests.map(req => {
          var setting: JQueryAjaxSettings = {
            "async": true,
            "contentType": "application/json",
            "crossDomain": true,
            "url": `${state.urlBase}/${req.url}`,
            "method": "POST",
            "headers": state.header,
            "processData": false,
            "data": req.body
          };
          return setting;
        })
        let msg: TaskRequestInfo = { taskName: task.name, repeat: task.repeat, requests: settings }
        sendCommand(CommandReceiver.CurrentTab, "SendRequest", msg);
        task.countDown = task.repeat
        task.running = true;
        task.error = false;
      }
      return state;
    case ActionTypes.ChangeRepeat: {
      let task = state.tasks.filter(task => task.name === action.taskName)[0];
      if (task) {
        task.repeat = action.repeat
      }
      return state;
    }

    default:
      return state
  }
}

export const helperReducer = (state: AimiaState, action: Redux.AnyAction): AimiaState => {
  switch (action.type) {
    case ActionTypes.ErrorRaised: {
      let task = state.tasks.filter(task => task.name === action.taskName)[0];
      if (task) {
        task.running = false;
        task.error = true;
      }
      return state;
    }
    case ActionTypes.TaskFinished: {
      let task = state.tasks.filter(task => task.name === action.taskName)[0];
      if (task) {
        task.running = false;
        task.error = false;
      }
      return state;
    }
    case ActionTypes.TaskUpdated: {
      let task = state.tasks.filter(task => task.name === action.taskName)[0];
      if (task) {
        task.countDown = action.countDown;
      }
      return state;
    }
    case ActionTypes.UpdateHeader: {
      state.header = action.header;
      state.urlBase = action.urlBase;
      return state;
    }
    case ActionTypes.UpdateRequestBody: {
      state.tasks.forEach(task => {
        task.requests.forEach(reqInfo => {
          if (reqInfo.name === action.reqName) {
            reqInfo.body = action.reqBody;
            reqInfo.url = action.url;
          }
        })
        let isReady = task.requests.filter(x => x.body && x.url).length === task.requests.length;
        task.ready = isReady;
        debug(`task ${task.name} ${action.reqName} is ready:${task.ready}`)
      })
      return state;
    }

    default:
      return state
  }
}
