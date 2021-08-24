import React from 'react';
import SvgIcon from 'material-ui/SvgIcon';

const RemoveFromPhotos = (props) => (
  <SvgIcon {...props}>
    <path d="M 4 6 L 2 6 L 2 20 C 2 21.1 2.9 22 4 22 L 18 22 L 18 20 L 4 20 L 4 6 Z M 20 2 L 8 2 C 6.9 2 6 2.9 6 4 L 6 16 C 6 17.1 6.9 18 8 18 L 20 18 C 21.1 18 22 17.1 22 16 L 22 4 C 22 2.9 21.1 2 20 2 Z M 19.006 5.956 L 15.01 10 L 19.006 14.06 L 17.983 15.011 L 14.019 10.995 L 10.003 15.011 L 8.991 14.06 L 13.003 10 L 8.991 5.956 L 10.003 4.982 L 14.019 8.994 L 17.983 4.982 L 19.006 5.956 Z" />
  </SvgIcon>
);

RemoveFromPhotos.displayName = 'ImageAddToPhotos';
RemoveFromPhotos.muiName = 'SvgIcon';

export default RemoveFromPhotos;
