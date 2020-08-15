import React from 'react';

function Books (){
    function Book(title, author, booklink, authorlink = null) {
        this.title = title;
        this.author = author;
        this.booklink = booklink;
        this.authorlink = authorlink;
        this.bookHTML = <p> <a href = {this.booklink}> {this.title} </a>, by <a href = {this.authorlink}> {this.author} </a> </p>;
    }

    const book1 = new Book(
        'Principles:Life and Work',
        'Ray Dalio',
        'https://bookshop.org/books/principles-life-and-work-9781508243243/9781501124020',
        'https://en.wikipedia.org/wiki/Ray_Dalio')
    const book2 = new Book(
        'What you do is who you are',
        'Ben Horowitz',
        'https://bookshop.org/books/what-you-do-is-who-you-are-how-to-create-your-business-culture/9780062871336',
        'https://en.wikipedia.org/wiki/Ben_Horowitz',
        )
    const books = [book1, book2]

  return (
    <div className = 'widget'>
    <h1> Things I enjoyed reading:</h1>
    
    {books.map(book => (
        book.bookHTML

    ))}
    </div>
  )
};


export default Books;