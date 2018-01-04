import * as Redux from 'redux';
import { subscribeEvent, publishEvent, debug, getChromeStorageData, setChromeStorageData, requestMessage, delay } from './base';



interface ChromeStore<S> extends Redux.Store<S> {
  unload: () => void
}

export const createChromeStore = async <S>(reducer?: Redux.Reducer<S>, preloadedState?: S): Promise<ChromeStore<S>> => {
  return new Promise<ChromeStore<S>>((resolve, reject) => {
    let state: S = preloadedState;
    let listeners: (() => void)[] = [];
    let isInit = false;
    let storeKey = 'storeReducerIndex';
    let unsubscribeReducer: () => void = () => { };

    const updateState = (s: S) => {
      state = s;
      listeners.forEach(listener => listener());
      debug('notify listeners', listeners);
    }


    const getState = (): S => state;

    const doDispatch = async (action: any) => {
      let storeKey = 'storeReducerIndex';
      let storeReducerIndex = await getChromeStorageData<number>(storeKey);
      for (let i = 0; i <= storeReducerIndex; i++) {
        debug(`${i} ${storeReducerIndex}`)
        try {
          let resp = await requestMessage(`reducer.${i}`, action, 50)
        } catch (error) {
          debug(error)
        }

      }

    }

    const dispatch = <A extends Redux.Action>(action: A): A => {
      debug(`dispatch action ${action.type}`, action);
      doDispatch(action).then(() => {
        debug(`processed action ${action.type}`, action);
      });

      return action;
    };

    const subscribe = (listener: () => void): Redux.Unsubscribe => {
      listeners.push(listener);
      debug('add listener', listener);
      return () => {
        listeners = listeners.filter(l => l !== listener);
      }
    };

    const replaceReducer = (nextReducer: Redux.Reducer<S>): void => {
      //throw new Error("Method not implemented.");
      debug('replaceReducer');
      reducer = nextReducer;
    }

    const unload = async () => {
      unsubscribeReducer();
      let storeReducerIndex = await getChromeStorageData<number>(storeKey);

      if (storeReducerIndex === undefined) {
        return;
      }
      storeReducerIndex--;
      await setChromeStorageData(storeKey, storeReducerIndex);
    }

    const returnResult = () => {
      if (!isInit) {
        resolve({ getState, dispatch, subscribe, replaceReducer, unload });
        isInit = true;
      }
    }

    let actionQueue: any[] = [];

    let reducerLoopStarted = false;
    const reducerLoop = async (storeReducerIndex: number) => {
      if (reducerLoopStarted) return;
      reducerLoopStarted = true;
      while (true) {
        let action = actionQueue.shift();
        if (!action) {
          await delay(50);
          continue;
        }
        debug(`handle action ${action.type}`, action)
        let store = await getChromeStorageData<any>('store');
        state = reducer(store, action);
        await setChromeStorageData('store', state);
        publishEvent(`reducer.${storeReducerIndex}.response`, state)
      }

    }

    const setReducer = async () => {
      if (reducer) {

        let storeReducerIndex = await getChromeStorageData<number>(storeKey);

        if (storeReducerIndex === undefined) {
          storeReducerIndex = -1;
        }
        storeReducerIndex++;
        await setChromeStorageData(storeKey, storeReducerIndex);
        reducerLoop(storeReducerIndex)
        unsubscribeReducer = subscribeEvent(`reducer.${storeReducerIndex}`, async (action: any) => {
          actionQueue.push(action);
        })
      }

    }

    const init = () => {
      chrome.storage.onChanged.addListener((changes, ns) => {
        if (changes.store) {
          let s = changes.store.newValue;
          debug('store data changed ', s);
          updateState(s)
        }
      });

      if (!state) {
        chrome.storage.local.get("store", value => {
          state = value.store;
          updateState(value.store)
          debug('chrome store loaded from storage', state);
          returnResult();
        })
      } else {
        updateState(state)
        debug('chrome store loaded from pre data', state);
        chrome.storage.local.set({ store: state })
        returnResult();
      }

    }

    setReducer().then(() => {
      init();
    })
  });
};
