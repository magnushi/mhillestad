import React from 'react';

function Blog (){
  const posts = ['post1', 'post2']

  return (
    <div className = 'widget'>
    <h1> Here is my blog:</h1>
    
    {posts.map(post => (
        <h2> {post.toUpperCase()} </h2>
    ))}

    </div>
  )
};


export default Blog;