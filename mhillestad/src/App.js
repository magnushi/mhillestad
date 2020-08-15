import React from 'react';
import './App.css';
import Bio from './Bio.js';
import Blog from './Blog.js';
import Books from './Books.js';

function App (){
  const me = 'Magnus Hillestad'

  return (
    <div className = 'main'>
      <h1> {me} Homepage </h1>
      <Bio />
      <Blog />
      <Books /> 
    </div>
  )
};


export default App;