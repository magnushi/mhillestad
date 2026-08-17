import { defineArrayMember, defineField, defineType } from 'sanity';

export const investmentGroup = defineType({
  name: 'investmentGroup',
  type: 'object',
  title: 'Investment group',
  fields: [
    defineField({
      name: 'heading',
      type: 'string',
      title: 'Heading',
      description: 'Printed above the table, e.g. "funds/".',
    }),
    defineField({
      name: 'key',
      type: 'string',
      title: 'Group key',
      description:
        'How an investment table block refers to this group, e.g. "funds". Lowercase, no spaces.',
      validation: (Rule) => Rule.required().lowercase(),
    }),
    defineField({
      name: 'investments',
      type: 'array',
      title: 'Investments',
      description: 'Drag to reorder. This is the order shown on the site.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'investment' }] })],
    }),
  ],
  preview: {
    select: { title: 'heading', subtitle: 'key' },
  },
});
