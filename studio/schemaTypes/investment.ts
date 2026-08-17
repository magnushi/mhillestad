import { defineField, defineType } from 'sanity';

export const investment = defineType({
  name: 'investment',
  type: 'document',
  title: 'Investment',
  description:
    'A company or fund. Which group it belongs to, and in what order, is decided on the Home page — not here.',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      type: 'url',
      title: 'URL',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'url' },
  },
});
