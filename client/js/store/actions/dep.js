

export function setActiveDepartment(_id) {
  console.log("in action");
  return (dispatch, getState) => {
    dispatch({
      type: 'CHANGE_ACTIVE_DEPARTMENT',
      id: _id,
    });
  }

}
