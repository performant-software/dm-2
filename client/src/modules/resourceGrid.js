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
            content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"One."}]},{"type":"horizontal_rule"},{"type":"paragraph","content":[{"type":"text","text":"Two! Here is some longer text, et cetera et "},{"type":"text","marks":[{"type":"highlight","attrs":{"highlightId":"dm_text_highlight_1522476560480"}}],"text":"cetera"}]},{"type":"paragraph","content":[{"type":"text","text":"Third "},{"type":"text","marks":[{"type":"highlight","attrs":{"highlightId":"dm_text_highlight_1522476566058"}}],"text":"paragraph"},{"type":"text","text":" hello hello hello"}]}]}',
            highlights: {
              'dm_text_highlight_1522476560480': {
                target: 'dm_text_highlight_1522476560480',
                links: [
                  {
                    resourceId: 'dm_resource_4',
                    highlightId: 'dm_text_highlight_1522476879313',
                    excerpt: 'Third'
                  }
                ]
              },
              'dm_text_highlight_1522476566058': {
                target: 'dm_text_highlight_1522476566058',
                links: []
              }
            }
          },
          {
            id: 'dm_resource_2',
            title: 'A Canvas Resource in the Store',
            type: CANVAS_RESOURCE_TYPE,
            content: '{"Image":{"xmlns":"http://schemas.microsoft.com/deepzoom/2008","Url":"http://openseadragon.github.io/example-images/highsmith/highsmith_files/","Format":"jpg","Overlap":"2","TileSize":"256","Size":{"Height":"9221","Width":"7026"}}}',
            highlights: {}
          },
          {
            id: 'dm_resource_3',
            title: 'Another Canvas Resource from Redux',
            type: CANVAS_RESOURCE_TYPE,
            content: '{"Image":{"xmlns":"http://schemas.microsoft.com/deepzoom/2008","Url":"http://openseadragon.github.io/example-images/highsmith/highsmith_files/","Format":"jpg","Overlap":"2","TileSize":"256","Size":{"Height":"9221","Width":"7026"}}}',
            highlights: {}
          },
          {
            id: 'dm_resource_4',
            title: 'One Last Redux Text Resource',
            type: TEXT_RESOURCE_TYPE,
            content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Text! Here is some longer text, et cetera et cetera"}]},{"type":"paragraph","content":[{"type":"text","marks":[{"type":"highlight","attrs":{"highlightId":"dm_text_highlight_1522476879313"}}],"text":"Third"},{"type":"text","text":" paragraph hello hello hello"}]}]}',
            highlights: {
              'dm_text_highlight_1522476879313': {
                target: 'dm_text_highlight_1522476879313',
                links: [
                  {
                    resourceId: 'dm_resource_1',
                    highlightId: 'dm_text_highlight_1522476560480',
                    excerpt: 'cetera'
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
