import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginSelectionScreen from './components/LoginSelectionScreen';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={LoginSelectionScreen} />
        <Route path="/student-login" component={() => <div>Student Login Page</div>} />
        <Route path="/jobseeker-login" component={() => <div>Job Seeker Login Page</div>} />
      </Switch>
    </Router>
  );
};

export default App;