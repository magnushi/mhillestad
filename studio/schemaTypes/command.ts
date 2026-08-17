import { defineArrayMember, defineField, defineType } from 'sanity';
import { terminalBody } from './terminalBody';

export const command = defineType({
  name: 'command',
  type: 'document',
  title: 'CLI command',
  description:
    'A command the visitor can type. Its position in the help listing is set on the Home page.',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Command',
      description: 'What the visitor types, lowercase. e.g. "about".',
      validation: (Rule) => Rule.required().lowercase(),
    }),
    defineField({
      name: 'aliases',
      type: 'array',
      title: 'Aliases',
      description: 'Other names that run this same command, e.g. "ls" for "help".',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'description',
      type: 'string',
      title: 'One-line description',
      description: 'Shown next to the command in the help listing.',
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Output',
      description: 'What gets printed when the command runs.',
      of: terminalBody,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'description' },
  },
});
