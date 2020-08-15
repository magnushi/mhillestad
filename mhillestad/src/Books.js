import React from 'react';

function Books (){
    function Book(title, author, booklink, authorlink = null) {
        this.title = title;
        this.author = author;
        this.booklink = booklink;
        this.authorlink = authorlink;
        this.bookrecommendationlink = "<a href = {booklink}> {title} </a>";
        this.authorrecommendationlink = "<a href = {authorlink}> {author} </a>";
    }

    const book1 = new Book(
        title = 'Principles:Life and Work',
        author = 'Ray Dalio',
        booklink = 'https://bookshop.org/books/principles-life-and-work-9781508243243/9781501124020',
        authorlink = 'https://en.wikipedia.org/wiki/Ray_Dalio')
    
        const book2 = new Book(
        title = 'What you do is who you are',
        author = 'Ben Horowitz',
        booklink = 'https://bookshop.org/books/what-you-do-is-who-you-are-how-to-create-your-business-culture/9780062871336',
        authorlink = 'https://en.wikipedia.org/wiki/Ben_Horowitz',
        )
    const books = [book1, book2]

  return (
    <div className = 'widget'>
    <h1> Things I enjoyed reading:</h1>
    
    {books.map(book => (
        <p> {book.bookrecommendationlink}, by {book.authorrecommendationlink} </p>

    ))}
    </div>
  )
};


export default Books;