import { defineType } from 'sanity';

// Prints the podcast list, by title. Drop this into the `podcasts` command.
export const podcastList = defineType({
  name: 'podcastList',
  type: 'object',
  title: 'Podcast list',
  description: 'Prints every podcast, by title.',
  fields: [
    {
      name: 'showNotes',
      type: 'boolean',
      title: 'Show notes',
      description: 'Print each podcast’s one-line note under it.',
      initialValue: false,
    },
  ],
  preview: {
    select: { showNotes: 'showNotes' },
    prepare: ({ showNotes }) => ({
      title: 'Podcast list',
      subtitle: showNotes ? 'with notes' : 'titles only',
    }),
  },
});
