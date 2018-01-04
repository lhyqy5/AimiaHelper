import * as React from "react"
import { connect } from 'react-redux'

import { TaskInfo, AimiaState, _T } from "../base";
import { TaskItem } from './TaskItem'


const PopupPageView = ({header,tasks}:{header: any, tasks: TaskInfo[]}) => {
  let rtn = <span className="notInit">{_T('notInit')}</span>;
  if (header) {
    rtn = (
      <div>
        {tasks.filter(x=>!x.disabled).map((task, i) => <TaskItem key={i} name={task.name} />)}
      </div>
    )
  }
  return rtn;
}

const mapStateToProps = (state: AimiaState, ownProps:any) => {
  return {
    tasks: state.tasks,
    header: state.header
  }
}

export const PopupPage = connect(
  mapStateToProps
)(PopupPageView)


