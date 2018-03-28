import {TEXT_RESOURCE_TYPE, CANVAS_RESOURCE_TYPE} from './project';

export const DEFAULT_LAYOUT = 'default';
export const OPEN_RESOURCES = 'resource_grid/OPEN_RESOURCES';
export const CLEAR_RESOURCES = 'resource_grid/CLEAR_RESOURCES';
export const ADD_HIGHLIGHT = 'resource_grid/ADD_HIGHLIGHT';

const initialState = {
  layout: DEFAULT_LAYOUT,
  openResources: []
};

export default function(state = initialState, action) {
  switch (action.type) {
    case OPEN_RESOURCES:
      return {
        ...state,
        openResources: [
          {
            id: 'dm_resource_1',
            title: 'A Text Resource in the Store',
            type: TEXT_RESOURCE_TYPE,
            content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"One."}]},{"type":"horizontal_rule"},{"type":"paragraph","content":[{"type":"text","text":"Two! Here is some longer text, et cetera et cetera"}]},{"type":"paragraph","content":[{"type":"text","text":"Third paragraph hello hello hello"}]}]}',
            highlights: {
              'dm_text_highlight_1': {
                target: {from: 13, to: 17},
                links: [
                  {
                    resourceId: 'dm_resource_4',
                    highlightId: 'dm_text_highlight_2',
                    excerpt: 'longer'
                  }
                ]
              }
            }
          },
          {
            id: 'dm_resource_2',
            title: 'A Canvas Resource in the Store',
            type: CANVAS_RESOURCE_TYPE,
            content: '{"Image":{"xmlns":"http://schemas.microsoft.com/deepzoom/2008","Url":"http://openseadragon.github.io/example-images/highsmith/highsmith_files/","Format":"jpg","Overlap":"2","TileSize":"256","Size":{"Height":"9221","Width":"7026"}}}'
          },
          {
            id: 'dm_resource_3',
            title: 'Another Canvas Resource from Redux',
            type: CANVAS_RESOURCE_TYPE,
            content: '{"Image":{"xmlns":"http://schemas.microsoft.com/deepzoom/2008","Url":"http://openseadragon.github.io/example-images/highsmith/highsmith_files/","Format":"jpg","Overlap":"2","TileSize":"256","Size":{"Height":"9221","Width":"7026"}}}'
          },
          {
            id: 'dm_resource_4',
            title: 'One Last Redux Text Resource',
            type: TEXT_RESOURCE_TYPE,
            content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"One."}]},{"type":"horizontal_rule"},{"type":"paragraph","content":[{"type":"text","text":"Two! Here is some longer text, et cetera et cetera"}]},{"type":"paragraph","content":[{"type":"text","text":"Third paragraph hello hello hello"}]}]}',
            highlights: {
              'dm_text_highlight_2': {
                target: {from: 26, to: 32},
                links: [
                  {
                    resourceId: 'dm_resource_1',
                    highlightId: 'dm_text_highlight_1',
                    excerpt: 'longer'
                  }
                ]
              }
            }
          }
        ]
      };

    case CLEAR_RESOURCES:
      return {
        ...state,
        openResources: []
      };

    case ADD_HIGHLIGHT:
      let resourceIndex = state.openResources.findIndex(resource => resource.id === action.resourceId);
      let updatedOpenResources = state.openResources.slice(0);
      if (resourceIndex >= 0) {
        let updatedResource = Object.assign(updatedOpenResources[resourceIndex], {});
        updatedResource.highlights[`dm_new_highlight_${Date.now()}`] = {
          target: action.highlightTarget,
          links: []
        };
        updatedOpenResources.splice(resourceIndex, 1, updatedResource);
      }
      console.log(updatedOpenResources);
      return {
        ...state,
        openResources: updatedOpenResources
      }

    default:
      return state;
  }
}

export function openDummyResources() {
  return function(dispatch) {
    dispatch({
      type: OPEN_RESOURCES
    });
  }
}

export function closeAllResources() {
  return function(dispatch) {
    dispatch({
      type: CLEAR_RESOURCES
    });
  }
}

export function addHighlight(resourceId, highlightTarget) {
  return function(dispatch) {
    dispatch({
      type: ADD_HIGHLIGHT,
      resourceId,
      highlightTarget
    });
  }
}
