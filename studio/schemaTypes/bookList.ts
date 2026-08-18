import { defineType } from 'sanity';

// Prints the reading list — only the books switched on for the site. Drop this
// into the `books` command.
export const bookList = defineType({
  name: 'bookList',
  type: 'object',
  title: 'Reading list',
  description: 'Prints every book marked "Show on the site", by author.',
  fields: [
    {
      name: 'category',
      type: 'string',
      title: 'Limit to one category',
      description: 'Leave empty to list fiction and non-fiction together.',
      options: {
        list: [
          { title: 'Non-fiction only', value: 'nonfiction' },
          { title: 'Fiction only', value: 'fiction' },
        ],
      },
    },
    {
      name: 'showNotes',
      type: 'boolean',
      title: 'Show notes',
      description: 'Print each book’s one-line note under it.',
      initialValue: false,
    },
  ],
  preview: {
    select: { category: 'category', showNotes: 'showNotes' },
    prepare: ({ category, showNotes }) => ({
      title: 'Reading list',
      subtitle: [category ? `${category} only` : 'everything', showNotes ? 'with notes' : null]
        .filter(Boolean)
        .join(' · '),
    }),
  },
});
