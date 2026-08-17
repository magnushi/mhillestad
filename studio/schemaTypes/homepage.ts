import { defineArrayMember, defineField, defineType } from 'sanity';

export const homepage = defineType({
  name: 'homepage',
  type: 'document',
  title: 'Home page',
  description:
    'Steers the terminal: which commands exist, which are advertised, in what order, and how investments are grouped.',
  fields: [
    defineField({
      name: 'metaDescription',
      type: 'text',
      title: 'Meta description',
      rows: 2,
    }),
    defineField({
      name: 'bootCommand',
      type: 'reference',
      title: 'Command run on load',
      description: 'Runs automatically when the page opens. Usually "help".',
      to: [{ type: 'command' }],
    }),
    defineField({
      name: 'commands',
      type: 'array',
      title: 'Commands',
      description:
        'Every command the site has. Drag to set the order they appear in "help"; switch "Show in help" off to make one hidden but still typeable. A command missing from this list does not exist on the site.',
      of: [defineArrayMember({ type: 'commandSlot' })],
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
