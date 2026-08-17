import { defineArrayMember, defineField, defineType } from 'sanity';

export const homepage = defineType({
  name: 'homepage',
  type: 'document',
  title: 'Home page',
  description:
    'Steers the terminal home page: which commands are listed, in what order, and how investments are grouped.',
  fields: [
    defineField({
      name: 'metaDescription',
      type: 'text',
      title: 'Meta description',
      rows: 2,
    }),
    defineField({
      name: 'bootCommand',
      type: 'string',
      title: 'Command run on load',
      description: 'Runs automatically when the page opens. "help" and "clear" are built in.',
    }),
    defineField({
      name: 'commands',
      type: 'array',
      title: 'Help listing',
      description:
        'Drag to set the order commands appear in "help". A command left out of this list still runs if typed — it is just not advertised.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'command' }] })],
    }),
    defineField({
      name: 'investmentGroups',
      type: 'array',
      title: 'Investment groups',
      description: 'Drag to reorder the groups, and drag investments within each group.',
      of: [defineArrayMember({ type: 'investmentGroup' })],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Home page' }),
  },
});
