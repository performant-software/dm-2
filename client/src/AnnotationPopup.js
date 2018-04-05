import React, {Component} from 'react';

const AnnotationList = function(props) {
  if (props.items && props.items.length > 0) {
    return (
      <ul>
        {props.items.map(function(item) {
          return <li key={item.id} onClick={() => props.handleClick(item.resourceId, item.highlightId)} >
            {item.excerpt &&
              <span><span style={{ background: 'yellow' }}>{item.excerpt}</span> in </span>
            }
            {item.resourceName}
          </li>
        })}
      </ul>
    );
  }
  else {
    return <p style={{ color: '#CCC' }}>No links</p>;
  }
}

export default class AnnotationPopup extends Component {
  linkClicked(resourceId, highlightId) {
    console.log('highlight summary click: ' + resourceId + ' ' + highlightId);
  }

  render() {
    const {target, resources} = this.props;
    // const {highlights, highlightId} = this.props;
    if (target === null) return null;

    // const links = highlights[highlightId].linksTo;
    // const refs = highlights[highlightId].referencedBy;

    // const linksTo = links && links.length > 0 ? links.map(function(linkId) {
    //   return {id: linkId, resourceName: highlights[linkId].resourceName};
    // }) : [];
    // const referencedBy = refs && refs.length > 0 ? refs.map(function(refId) {
    //   return {id: refId, resourceName: highlights[refId].resourceName};
    // }) : [];

    const items = target.links && target.links.length > 0 ? target.links.map(function(link) {
      return {
        id: link.resourceId + (link.highlightId ? link.highlightId : ''),
        resourceId: link.resourceId,
        highlightId: link.highlightId,
        resourceName: resources[link.resourceId].title,
        excerpt: link.excerpt
      };
    }) : [];

    return (
      <div style={{ position: 'absolute', top: '200px', left: '360px', background: 'white', width: '300px', minHeight: '300px', boxShadow: '5px 2px 5px rgba(0, 0, 0, 0.2)', border: '1px solid black', padding: '10px' }}>
        <div style={{ position: 'absolute', top: '5px', right: '10px', cursor: 'pointer' }} onMouseDown={this.props.closeHandler}>x</div>
        <h3 style={{ margin: '0 0 10px 0' }}>Links</h3>
        <AnnotationList items={items} handleClick={this.linkClicked} />
      </div>
    );
  }
}
