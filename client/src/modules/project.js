export const TEXT_RESOURCE_TYPE = 'text';
export const CANVAS_RESOURCE_TYPE = 'canvas';
export const LOAD_PROJECT = 'project/LOAD_PROJECT';
export const CLEAR_PROJECT = 'project/CLEAR_PROJECT';

const initialState = {
  id: null,
  title: 'No project selected',
  contentsChildren: []
};

export default function(state = initialState, action) {
  switch (action.type) {
    case LOAD_PROJECT:
      return {
        id: 'dm_project_1',
        title: 'My DM 2.0 Project',
        contentsChildren: [
          {
            id: 'dm_resource_1',
            title: 'A Text Resource in the Store',
            type: TEXT_RESOURCE_TYPE
          },
          {
            id: 'dm_resource_2',
            title: 'A Canvas Resource in the Store',
            type: CANVAS_RESOURCE_TYPE,
            thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Dendrocygna_bicolor_wilhelma.jpg/200px-Dendrocygna_bicolor_wilhelma.jpg'
          },
          {
            id: 'dm_resource_3',
            title: 'Another Canvas Resource from Redux',
            type: CANVAS_RESOURCE_TYPE,
            thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Dendrocygna_bicolor_wilhelma.jpg/200px-Dendrocygna_bicolor_wilhelma.jpg'
          },
          {
            id: 'dm_resource_4',
            title: 'One Last Redux Text Resource',
            type: TEXT_RESOURCE_TYPE
          }
        ]
      };

    case CLEAR_PROJECT:
      return initialState;

    default:
      return state;
  }
}

export function loadProject() {
  return function(dispatch) {
    dispatch({
      type: LOAD_PROJECT
    });
  }
}

export function clearProject() {
  return function(dispatch) {
    dispatch({
      type: CLEAR_PROJECT
    });
  }
}
