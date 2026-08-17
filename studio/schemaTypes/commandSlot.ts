import { defineField, defineType } from 'sanity';

// One command as it appears on the site. Visibility used to be implied by
// whether a command was in the home page's array at all, which meant nobody
// could see which commands were hidden — they simply looked absent. It is a
// flag now, so the list shows the whole command surface and says plainly which
// entries are advertised.
export const commandSlot = defineType({
  name: 'commandSlot',
  type: 'object',
  title: 'Command',
  fields: [
    defineField({
      name: 'command',
      type: 'reference',
      title: 'Command',
      to: [{ type: 'command' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'listed',
      type: 'boolean',
      title: 'Show in help',
      description:
        'Off makes it a hidden command: still runs when typed, but never advertised. Good for easter eggs.',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      name: 'command.name',
      description: 'command.description',
      listed: 'listed',
    },
    prepare: ({ name, description, listed }) => ({
      title: listed === false ? `${name ?? 'command'} — hidden` : (name ?? 'command'),
      subtitle: description,
    }),
  },
});
