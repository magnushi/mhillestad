import { defineField, defineType } from 'sanity';

// A book on the reading list, printed by the `books` command. Like entries,
// these are not dragged into order — the listing sorts them by author.
//
// The list is a superset of what the site shows: a book is kept here whether or
// not it is published to the terminal, and `showOnSite` is the switch. It
// defaults to off, so adding a book is never the same act as publishing it.
export const book = defineType({
  name: 'book',
  type: 'document',
  title: 'Book',
  description:
    'A book on the reading list. Listed by author, so there is nothing to drag. It only appears on the site once "Show on the site" is switched on.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      type: 'string',
      title: 'Author',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'showOnSite',
      type: 'boolean',
      title: 'Show on the site',
      description:
        'Off by default. While this is off the book stays in the list here but prints nowhere on the site.',
      initialValue: false,
    }),
    defineField({
      name: 'category',
      type: 'string',
      title: 'Category',
      options: {
        list: [
          { title: 'Non-fiction', value: 'nonfiction' },
          { title: 'Fiction', value: 'fiction' },
        ],
        layout: 'radio',
      },
      initialValue: 'nonfiction',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      type: 'number',
      title: 'Year',
      description: 'Year of publication. Optional, and shown after the author.',
      validation: (Rule) => Rule.integer().min(0).max(2200),
    }),
    defineField({
      name: 'url',
      type: 'url',
      title: 'URL',
      description: 'Optional. When set, the title links here.',
    }),
    defineField({
      name: 'note',
      type: 'string',
      title: 'Note',
      description: 'Optional one-liner on why it is worth reading.',
    }),
  ],
  orderings: [
    {
      name: 'authorAsc',
      title: 'By author',
      by: [
        { field: 'author', direction: 'asc' },
        { field: 'title', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author',
      year: 'year',
      category: 'category',
      showOnSite: 'showOnSite',
    },
    prepare: ({ title, author, year, category, showOnSite }) => ({
      // Lead with the hidden state: it is the thing you scan the list for.
      title: showOnSite ? title : `· ${title}`,
      subtitle: [showOnSite ? null : 'hidden', author, year, category]
        .filter(Boolean)
        .join(' · '),
    }),
  },
});
