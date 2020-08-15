import React from 'react';

function Blog (){
  const posts = ['post1', 'post2']

  return (
    <div className = 'widget'>
    <h1> Here is my blog:</h1>
    
    {posts.map(post => (
        <h4> {post.toUpperCase()} </h4>
    ))}

    </div>
  )
};


export default Blog;