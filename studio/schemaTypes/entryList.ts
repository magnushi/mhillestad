import { defineField, defineType } from 'sanity';

// Prints blog entries, newest first. Drop one of these into the `blog` command
// to list everything, or set a kind to print just the talks or just the press.
export const entryList = defineType({
  name: 'entryList',
  type: 'object',
  title: 'Blog listing',
  description: 'Prints blog entries newest first, each with its date and kind.',
  fields: [
    defineField({
      name: 'kind',
      type: 'string',
      title: 'Limit to one kind',
      description: 'Leave empty to list posts, talks and press together.',
      options: {
        list: [
          { title: 'Posts only', value: 'post' },
          { title: 'Talks only', value: 'talk' },
          { title: 'Press only', value: 'press' },
        ],
      },
    }),
    defineField({
      name: 'limit',
      type: 'number',
      title: 'Show at most',
      description: 'Leave empty to print all of them.',
      validation: (Rule) => Rule.min(1).integer(),
    }),
  ],
  preview: {
    select: { kind: 'kind', limit: 'limit' },
    prepare: ({ kind, limit }) => ({
      title: 'Blog listing',
      subtitle: [kind ? `${kind} only` : 'everything', limit ? `max ${limit}` : null]
        .filter(Boolean)
        .join(' · '),
    }),
  },
});
