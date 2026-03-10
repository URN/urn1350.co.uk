import React from 'react';
import Paper from '@mui/material/Paper';

import Settings from '../../settings.json';
  
  export default class ComicRelief extends React.Component {
    render() {
      return <Paper elevation={3} className="comic-relief" color='primary'>
          <h1>Comic Relief</h1>
          <p>This week, our usual service is interrupted by our 24 hour shows!</p>
          <p>This is in support of the charity Comic Releif</p>

          <p>You can donate <a href='https://www.justgiving.com/fundraising/rednoseday22-university-radio'>Here on our JustGiving Page</a>!</p>
        
        </Paper>;
    }}