import React from 'react';
import Paper from '@material-ui/core/Paper';

import Settings from '../../settings.json';
  
  export default class News extends React.Component {
    render() {
      return <Paper elevation={3} className="comic-relief">
          <h1>University Radio Nottingham is back!</h1>
          <p>After a year of being off-air, URN returns to the airwaves - from a brand new studio!</p>
          <p>Want to get involved in the excitement? Join <a href="https://join.urn1350.co.uk/">here</a>!</p>
        
        </Paper>;
    }}