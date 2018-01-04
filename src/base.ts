

export interface TaskInfo {
  name: string
  repeat: number
  disabled?:boolean
  ready?: boolean
  requests: RequestInfo[]
  countDown?: number
  running?: boolean
  error?: boolean
}
export interface RequestInfo {
  name: string
  url?: string
  body?: any
}

export interface AimiaState {
  header?: any
  urlBase?: string
  tasks: TaskInfo[]
}

export interface TaskRequestInfo {
  taskName: string
  repeat: number
  requests: JQueryAjaxSettings[]
}

export interface AimiaConfig{
  filterUrls:string[]
  tasks: TaskInfo[]
  requests:{name:string,url:string}[]
}

export interface ICommand<T> {
  cmdType: string
  receiver: number
  body: T

}

export interface IEvent<T> {
  eventType: string
  body: T
}

export interface IMessage<T> {
  type: "cmd" | "event"
  message: IEvent<T> | ICommand<T>
}


// if (!String.prototype['format']) {
//   String.prototype['format'] = function () {
//     var args = arguments;
//     return this.replace(/{(\d+)}/g, function (match, number) {
//       return typeof args[number] != 'undefined'
//         ? args[number]
//         : match
//         ;
//     });
//   };
// }

export enum CommandReceiver {
  CurrentTab = -2,
  All = -1
}

/**
 * send command
 * @param receiver -2 current active tab,-1 All,0 runtime,else tabId
 * @param cmdType command type
 * @param body  message body
 */
export function sendCommand<T>(receiver: CommandReceiver | number, cmdType: string, body: T) {
  debug(`send command,type:${cmdType} receiver:${receiver}`,body)
  let cmd: ICommand<T> = {
    cmdType,
    body,
    receiver
  }
  let msg: IMessage<T> = { type: "cmd", message: cmd };
  if (cmd.receiver == CommandReceiver.CurrentTab) {
    chrome.tabs && chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, msg);
      })
    })
  }
  else if (cmd.receiver == CommandReceiver.All) {
    chrome.tabs && chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, msg);
      })
    })
  }
  else if (cmd.receiver == 0) {
    chrome.runtime.sendMessage(msg);
  } else {
    chrome.tabs && chrome.tabs.sendMessage(cmd.receiver, msg);
  }
}

export function publishEvent<T>(eventType: string, body: T) {
  debug(`publish event type:${eventType}`,body)
  let event: IEvent<T> = {
    eventType,
    body
  }
  var msg: IMessage<T> = { type: "event", message: event };

  chrome.tabs && chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, msg);
    })

  })
  chrome.runtime.sendMessage(msg);

  ensureHandler();
  let handlers: ((msg: any) => void)[] = [];
  if (_eventHandlers.has(eventType)) {
    handlers = _eventHandlers.get(eventType);
  }
  handlers.forEach(handler => {
    handler(body);
  })
}

let _handlerInitd = false;
let _cmdHandlers: Map<string, Array<(msg: any) => void>> = new Map()
let _eventHandlers: Map<string, Array<(msg: any) => void>> = new Map()

let ensureHandler = () => {
  if (_handlerInitd) return;
  _handlerInitd = true;
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type && msg.type === "cmd") {
      let cmd: ICommand<any> = msg.message;
      if (_cmdHandlers.has(cmd.cmdType)) {
        let handlers = _cmdHandlers.get(cmd.cmdType);
        handlers.forEach(handler => {
          handler(cmd.body)
        })
      }
    }
    if (msg.type && msg.type === "event") {
      let event: IEvent<any> = msg.message;
      if (_eventHandlers.has(event.eventType)) {
        let handlers = _eventHandlers.get(event.eventType);
        handlers.forEach(handler => {
          handler(event.body)
        })
      }
    }
  })
}

export function handleCommand<T>(cmdType: string, callback: (msg: T) => void) {
  debug(`register command handler type:${cmdType}`)
  ensureHandler();
  let handlers: ((msg: any) => void)[] = [];
  if (_cmdHandlers.has(cmdType)) {
    handlers = _cmdHandlers.get(cmdType);
  }
  handlers.push(callback);
  _cmdHandlers.set(cmdType, handlers);
}

export function subscribeEvent<T>(eventType: string, callback: (msg: T) => void) {
  debug(`register event handler type:${eventType}`)
  ensureHandler();
  let handlers: ((msg: any) => void)[] = [];
  if (_eventHandlers.has(eventType)) {
    handlers = _eventHandlers.get(eventType);
  }
  handlers.push(callback);
  _eventHandlers.set(eventType, handlers);

  return () => {
    handlers = handlers.filter(l => l !== callback);
    _eventHandlers.set(eventType, handlers);
    //debug(`unsubscribe event handler type:${eventType} handler:${callback}`)
  }

}


export function _T(key: string) {
  return chrome.i18n.getMessage(key);
}

export function debug(msg: any, ...opt: any[]) {
  //console.error(msg, opt);
}

export const delay= async(ms:number)=>{
  return new Promise((r,x)=>{
    setTimeout(()=>{
      r()
    },ms)
  })


}

export const requestMessage = <Req, Rep>(msgType: string, req: Req,timeout:number=1000): Promise<Rep> => {
  return new Promise<Rep>((resolve, reject) => {
    publishEvent(msgType, req);
    let unsub = subscribeEvent(`${msgType}.response`, (rep: Rep) => {
      resolve(rep)
      unsub();
    })
    setTimeout(()=>{
      reject(new Error('timeout'))
    },timeout)
  })
}

export const getChromeStorageData = <T>(key: string): Promise<T> => {
  return new Promise<T>((r, x) => {
    chrome.storage.local.get(key, o => {
      r(o[key])
    })
  })
}
export const setChromeStorageData = <T>(key: string, data: T): Promise<void> => {
  return new Promise<void>((r, x) => {
    let o: any = {};
    o[key] = data;
    chrome.storage.local.set(o, () => {
      r()
    })
  })
}
