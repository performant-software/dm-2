import React, {Component} from 'react';

const AnnotationList = function(props) {
  if (props.items && props.items.length > 0) {
    return (
      <div>
        <p>{props.listHeader}</p>
        <ul>
          {props.items.map(function(item) {
            return <li key={item.id}>{item.resourceName}</li>
          })}
        </ul>
      </div>
    );
  }
  else {
    return <p style={{ color: '#CCC' }}>{props.noneText}</p>;
  }
}

export default class AnnotationPopup extends Component {
  render() {
    const {highlights, highlightId} = this.props;
    if (highlightId === null) return null;

    const links = highlights[highlightId].linksTo;
    const refs = highlights[highlightId].referencedBy;

    const linksTo = links && links.length > 0 ? links.map(function(linkId) {
      return {id: linkId, resourceName: highlights[linkId].resourceName};
    }) : [];
    const referencedBy = refs && refs.length > 0 ? refs.map(function(refId) {
      return {id: refId, resourceName: highlights[refId].resourceName};
    }) : [];

    return (
      <div style={{ position: 'absolute', top: '200px', left: '360px', background: 'white', width: '300px', minHeight: '300px', boxShadow: '5px 2px 5px #CCC', border: '1px solid black', padding: '10px' }}>
        <div style={{ position: 'absolute', top: '5px', right: '10px', cursor: 'pointer' }} onMouseDown={this.props.closeHandler}>x</div>
        <h3 style={{ margin: '0 0 10px 0' }}>Annotations</h3>
        <AnnotationList items={linksTo} listHeader='Links to:' noneText='Links to none' />
        <AnnotationList items={referencedBy} listHeader='Referenced by:' noneText='Referenced by none' />
      </div>
    );
  }
}
