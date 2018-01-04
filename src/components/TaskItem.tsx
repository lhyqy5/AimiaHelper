import * as React from "react"
import { Provider, connect } from 'react-redux'
import { TaskInfo, AimiaState, sendCommand, TaskRequestInfo, subscribeEvent, _T } from "../base";
import { AnyAction } from "redux";
import { ActionTypes } from "../reducers";

const TaskItemView = ({ task, global, onStartClick, onRepeatChange }:
  { task: TaskInfo, global: AimiaState, onStartClick: (taskName: string) => void, onRepeatChange: (taskName: string, repeat: number) => void }) => {
  const getBtnText = () => {
    if (task.running) {
      return `${task.countDown}`
    }
    if (task.error) {
      return _T('error')
    }
    return _T('start')
  }

  const getBtnTip = () => {

    if (task.error) {
      return _T('errorTip')
    }
    return ''
  }

  const renderReady = () => {
    return (
      <div className="taskItem">
        <span>{_T(task.name)}</span>
        <input type="number" title={_T('repeat')} value={task.repeat} onChange={e => onRepeatChange(task.name, parseInt(e.target.value))} />
        <button className={`${task.ready ? "ready" : ""} ${task.running ? "running" : ""} ${task.error ? "error" : ""}`}
          onClick={e => onStartClick(task.name)} title={getBtnTip()} disabled={task.running}>{getBtnText()}</button>
      </div>
    )
  }
  const renderNotReady = () => {
    return (
      <div className="taskItem">
        <span>{_T(task.name)}</span>
        <span title={_T('notReadyTip')}>{_T('notReady')}</span>
      </div>
    )
  }
  return task.ready ? renderReady() : renderNotReady();
}


const mapStateToProps = (state: AimiaState, ownProps:any) => {
  return {
    task: state.tasks.filter(t => t.name == ownProps.name)[0],
    global: state
  }
}

const mapDispatchToProps = (dispatch: (action: AnyAction) => void, ownProps:any) => {
  return {
    onStartClick: (taskName: string) => {
      dispatch({
        type: ActionTypes.StartTask,
        taskName
      })
    },
    onRepeatChange: (taskName: string, repeat: number) => {
      dispatch({
        type: ActionTypes.ChangeRepeat,
        taskName,
        repeat
      })
    }
  }
}

export const TaskItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskItemView)
