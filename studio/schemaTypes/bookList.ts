import { defineType } from 'sanity';

// Prints the whole reading list. Takes no options: there is one list, and every
// book is on it. Drop this into the `books` command.
export const bookList = defineType({
  name: 'bookList',
  type: 'object',
  title: 'Reading list',
  description: 'Prints every book, by author.',
  fields: [
    // Sanity requires at least one field on an object type. This one is here so
    // the block is configurable at all; leaving it off prints just the books.
    {
      name: 'showNotes',
      type: 'boolean',
      title: 'Show notes',
      description: 'Print each book’s one-line note under it.',
      initialValue: false,
    },
  ],
  preview: {
    select: { showNotes: 'showNotes' },
    prepare: ({ showNotes }) => ({
      title: 'Reading list',
      subtitle: showNotes ? 'with notes' : 'titles only',
    }),
  },
});
