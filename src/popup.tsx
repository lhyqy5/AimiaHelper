import { PopupPage } from './components/PopupPage'
import * as React from "react"
import * as ReactDOM from "react-dom"
import { Provider } from "react-redux"
import { createChromeStore } from "./chromeStore"
import { taskReducer } from './reducers';

createChromeStore(taskReducer).then(store => {
  ReactDOM.render(
    (
      <Provider store={store}>
        <PopupPage />
      </Provider>
    ),
    document.getElementById('main')
  );
  window.addEventListener("unload",e=>{
    //store.unload()
  })
})



