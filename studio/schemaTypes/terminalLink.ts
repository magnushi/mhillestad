import { defineField, defineType } from 'sanity';

export const terminalLink = defineType({
  name: 'terminalLink',
  type: 'object',
  title: 'Link',
  fields: [
    defineField({
      name: 'href',
      type: 'url',
      title: 'URL',
      validation: (Rule) => Rule.required(),
    }),
  ],
});
