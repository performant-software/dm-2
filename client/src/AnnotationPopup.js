import React, {Component} from 'react';
import { ResizableBox } from 'react-resizable';
import Paper from 'material-ui/Paper';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';
import Close from 'material-ui/svg-icons/navigation/close';
import { grey400 } from 'material-ui/styles/colors';
import LinkableSummary from './LinkableSummary';
import LinkableList from './LinkableList';
import 'react-resizable/css/styles.css';

const AnnotationList = function(props) {
  if (props.items && props.items.length > 0) {
    return (
      <LinkableList items={props.items} />
    );
  }
  else {
    return <Subheader style={{color: grey400}}>No links</Subheader>;
  }
}

export default class AnnotationPopup extends Component {
  linkClicked(resourceId, highlightId) {
    console.log('highlight summary click: ' + resourceId + ' ' + highlightId);
  }

  render() {
    const { target } = this.props;
    if (target === null) return null;

    const targetItem = {
      id: 'target',
      title: target.resourceName,
      excerpt: target.excerpt,
      thumbnailUrl: target.thumbnailUrl,
      color: target.color,
      document_kind: target.document_kind
    };

    const items = target.links && target.links.length > 0 ? target.links.map(function(link) {
      return {
        id: link.resourceId + (link.highlightId ? link.highlightId : ''),
        // resourceId: link.resourceId,
        // highlightId: link.highlightId,
        title: link.documentTitle,
        document_kind: link.document_kind,
        excerpt: link.excerpt
      };
    }) : [];

    return (
      <Paper style={{ position: 'absolute', top: '200px', left: '360px', zIndex: '99'}} zDepth={4}>
        <ResizableBox width={300} height={300} minConstraints={[200, 120]} maxConstraints={[500, 800]}>
          <IconButton
            style={{ position: 'absolute', top: '0', right: '0'}}
            iconStyle={{width: '16px', height: '16px'}}
            onClick={this.props.closeHandler}
          >
            <Close />
          </IconButton>
          <Subheader>Edit Annotation</Subheader>
          <Divider />
          <LinkableSummary item={targetItem} isDraggable={true} />
          <Subheader style={{lineHeight: '32px'}}>Links to:</Subheader>
          <AnnotationList items={items} handleClick={this.linkClicked} />
        </ResizableBox>
      </Paper>
    );
  }
}
