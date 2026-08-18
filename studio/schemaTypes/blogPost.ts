import { defineField, defineType } from 'sanity';
import { terminalBody } from './terminalBody';

// A post written here rather than somewhere else. It is served at /blog/<slug>
// and appears in the `blog` listing alongside entries, sorted by the same date.
//
// The split is by where the writing lives, not by what it is: `blogPost` holds
// the words, `entry` only points at words published elsewhere.
export const blogPost = defineType({
  name: 'blogPost',
  type: 'document',
  title: 'Blog post',
  description:
    'A post written on this site, served at /blog/<slug>. It shows up in the `blog` listing automatically — there is no entry to create for it.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description: 'The path this post is served at, e.g. "why-terminals" for /blog/why-terminals.',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      type: 'date',
      title: 'Date',
      description: 'When it was published. This is what the listing sorts by.',
      options: { dateFormat: 'YYYY-MM-DD' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'metaDescription',
      type: 'text',
      title: 'Meta description',
      rows: 2,
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body',
      of: terminalBody,
    }),
  ],
  orderings: [
    {
      name: 'dateDesc',
      title: 'Newest first',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', date: 'date', slug: 'slug.current' },
    prepare: ({ title, date, slug }) => ({
      title,
      subtitle: [date, slug ? `/blog/${slug}` : null].filter(Boolean).join(' · '),
    }),
  },
});
