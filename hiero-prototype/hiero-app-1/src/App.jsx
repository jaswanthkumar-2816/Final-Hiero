import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginSelectionScreen from './components/LoginSelectionScreen';
import StudentLogin from './pages/StudentLogin';
import JobSeekerLogin from './pages/JobSeekerLogin';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={LoginSelectionScreen} />
        <Route path="/student-login" component={StudentLogin} />
        <Route path="/jobseeker-login" component={JobSeekerLogin} />
      </Switch>
    </Router>
  );
};

export default App;