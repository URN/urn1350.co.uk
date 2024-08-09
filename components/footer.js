import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import Settings from '../settings.json';

export default class Header extends React.Component {
  render() {
    return (
      <AppBar color="primary" position="static" component="footer">
        <div>
          <strong>&copy; URN {(new Date()).getFullYear()}</strong><br />
          University Radio Nottingham<br />
          <a href="/pages/competitions/">Competition Terms</a><br />
        </div>
        <div>
        </div>
        <div>
          <strong>Winner of Best Student Radio Station at the Student Radio Awards 2021, 2018, 2017, 2016, 2014, 2013, 2012, 2011, 2010!</strong><br />
          Find out more about us, and get in touch on our <a href="https://urn1350.co.uk/pages/about">About</a> page.
        </div>
        <div> 
          Please find our constitution <a href="https://constitution.urn1350.co.uk/constitution.pdf">here</a><br />
      </div>
      </AppBar>
    );
  }
}
