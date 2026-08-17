import { defineField, defineType } from 'sanity';

export const runCommand = defineType({
  name: 'runCommand',
  type: 'object',
  title: 'Run a command',
  description: 'Turns the text into a clickable button that runs another command.',
  fields: [
    defineField({
      name: 'command',
      type: 'string',
      title: 'Command name',
      validation: (Rule) => Rule.required(),
    }),
  ],
});
