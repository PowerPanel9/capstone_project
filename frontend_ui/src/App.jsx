import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

import UserProfile from "./components/userProfile/userProfile";
const App = () => {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/Profile" element = {user ? <UserProfile userId={user.id} /> : <Navigate to="/login" />} />
    </Routes>
    </BrowserRouter>
  )
}
export default App;
  