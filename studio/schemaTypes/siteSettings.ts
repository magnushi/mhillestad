import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  type: 'document',
  title: 'Site settings',
  description: 'Chrome and wording shared by every page.',
  fields: [
    defineField({
      name: 'siteTitle',
      type: 'string',
      title: 'Browser title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'metaDescription',
      type: 'text',
      title: 'Fallback meta description',
      description: 'Used for any page that does not set its own.',
      rows: 2,
    }),
    defineField({
      name: 'prompt',
      type: 'string',
      title: 'Shell prompt',
      description: 'Shown before each command, e.g. "magnus@mhillestad.com:~$".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'helpIntro',
      type: 'string',
      title: 'Help heading',
      description: 'Printed above the command listing, e.g. "available commands:".',
    }),
    defineField({
      name: 'notFoundMessage',
      type: 'string',
      title: 'Unknown command message',
      description:
        'Printed when a visitor types something that is not a command. Use {cmd} where the typed word should appear.',
    }),
    defineField({
      name: 'backLinkLabel',
      type: 'string',
      title: 'Back link on landing pages',
      description: 'The link that returns to the terminal, e.g. "cd ~".',
    }),
  ],
  preview: {
    select: { title: 'siteTitle' },
    prepare: ({ title }) => ({ title: 'Site settings', subtitle: title }),
  },
});
