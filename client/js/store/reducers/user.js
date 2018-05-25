



export default (state=null, action) => {
  switch(action.type) {
    case 'LOGIN_SUCCESS':
      return Object.assign({}, state, action.user)
      break;

    case 'LOGOUT_SUCCESS':
      console.log(action.type)
      return null;
      break;

    case 'SET_AVAILABILITY':
      console.log(action.isOwner);
      return Object.assign({}, state, {isOwner: action.isOwner});
      break;

    default:
      return state;
  }
}
