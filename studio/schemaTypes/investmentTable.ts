import { defineField, defineType } from 'sanity';

export const investmentTable = defineType({
  name: 'investmentTable',
  type: 'object',
  title: 'Investment table',
  description: 'Prints one of the investment groups defined on the Home page.',
  fields: [
    defineField({
      name: 'group',
      type: 'string',
      title: 'Group key',
      description: 'Must match the "Group key" of a group on the Home page, e.g. "funds".',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { subtitle: 'group' },
    prepare: ({ subtitle }) => ({ title: 'Investment table', subtitle }),
  },
});
