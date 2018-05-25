

export default (state=null, action) => {
  switch(action.type) {
    case 'CHANGE_ACTIVE_DEPARTMENT':
      return Object.assign({}, state, {activeDepartment: action.id})
      break;

    default:
      return state;
  }
}
