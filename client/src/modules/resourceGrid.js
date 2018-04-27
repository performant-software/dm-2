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
            documentKind: TEXT_RESOURCE_TYPE,
            content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"One."}]},{"type":"horizontal_rule"},{"type":"paragraph","content":[{"type":"text","text":"Two! Here is some longer text, et cetera et "},{"type":"text","marks":[{"type":"highlight","attrs":{"highlightId":"dm_text_highlight_1522476560480"}}],"text":"cetera"}]},{"type":"paragraph","content":[{"type":"text","text":"Third "},{"type":"text","marks":[{"type":"highlight","attrs":{"highlightId":"dm_text_highlight_1522476566058"}}],"text":"paragraph"},{"type":"text","text":" hello hello hello"}]}]},
            highlights: {
              'dm_text_highlight_1522476560480': {
                target: 'dm_text_highlight_1522476560480',
                excerpt: 'cetera',
                color: '#FFEB3B',
                links: [
                  {
                    resourceId: 'dm_resource_4',
                    documentKind: 'text',
                    highlightId: 'dm_text_highlight_1522476879313',
                    documentTitle: 'One Last Redux Text Resource',
                    excerpt: 'Third'
                  }
                ]
              },
              'dm_text_highlight_1522476566058': {
                target: 'dm_text_highlight_1522476566058',
                excerpt: 'paragraph',
                color: '#F44336',
                links: []
              }
            }
          },
          {
            id: 'dm_resource_2',
            title: 'A Canvas Resource in the Store',
            documentKind: CANVAS_RESOURCE_TYPE,
            content: {"Image":{"xmlns":"http://schemas.microsoft.com/deepzoom/2008","Url":"http://openseadragon.github.io/example-images/highsmith/highsmith_files/","Format":"jpg","Overlap":"2","TileSize":"256","Size":{"Height":"9221","Width":"7026"}}},
            highlights: {
              'dm_canvas_highlight_1523143914946': {
                target: '{"type":"rect","originX":"left","originY":"top","left":850,"top":1000,"width":300,"height":300,"fill":"transparent","stroke":"#2196F3","strokeWidth":5,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0}',
                color: '#2196F3',
                thumbnailUrl: '/DummyCanvasThumbnail.png',
                links: []
              }
            }
          },
          {
            id: 'dm_resource_3',
            title: 'Another Canvas Resource from Redux',
            documentKind: CANVAS_RESOURCE_TYPE,
            content: {"Image":{"xmlns":"http://schemas.microsoft.com/deepzoom/2008","Url":"http://openseadragon.github.io/example-images/highsmith/highsmith_files/","Format":"jpg","Overlap":"2","TileSize":"256","Size":{"Height":"9221","Width":"7026"}}},
            highlights: {}
          },
          {
            id: 'dm_resource_4',
            title: 'One Last Redux Text Resource',
            documentKind: TEXT_RESOURCE_TYPE,
            content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Text! Here is some longer text, et cetera et cetera"}]},{"type":"paragraph","content":[{"type":"text","marks":[{"type":"highlight","attrs":{"highlightId":"dm_text_highlight_1522476879313"}}],"text":"Third"},{"type":"text","text":" paragraph hello hello hello"}]}]},
            highlights: {
              'dm_text_highlight_1522476879313': {
                target: 'dm_text_highlight_1522476879313',
                excerpt: 'Third',
                color: '#FFEB3B',
                links: [
                  {
                    resourceId: 'dm_resource_1',
                    documentKind: 'text',
                    highlightId: 'dm_text_highlight_1522476560480',
                    documentTitle: 'A Text Resource in the Store',
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
        updatedResource.highlights[action.highlightId] = {
          target: action.highlightTarget,
          color: action.color,
          links: []
        };
        updatedOpenResources.splice(resourceIndex, 1, updatedResource);
      }
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

export function addHighlight(resourceId, highlightId, highlightTarget, color) {
  return function(dispatch) {
    dispatch({
      type: ADD_HIGHLIGHT,
      resourceId,
      highlightId,
      highlightTarget,
      color
    });
  }
}
