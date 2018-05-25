

export function setHasAvaiability(isOwner) {
  console.log("in action");
  return (dispatch, getState) => {
    dispatch({
      type: 'SET_AVAILABILITY',
      isOwner,
    });
  }

}
