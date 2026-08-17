import { defineArrayMember, defineField, defineType } from 'sanity';
import { terminalBody } from './terminalBody';

export const command = defineType({
  name: 'command',
  type: 'document',
  title: 'CLI command',
  description:
    'A command the visitor can type. Whether it is advertised in "help" — and in what order — is set on the Home page.',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Command',
      description: 'What the visitor types, lowercase. e.g. "about".',
      validation: (Rule) => Rule.required().lowercase(),
    }),
    defineField({
      name: 'kind',
      type: 'string',
      title: 'Kind',
      description:
        'Text prints the output below. Built-in runs code in the site — used for things a document cannot express, like a game.',
      options: {
        list: [
          { title: 'Text output', value: 'content' },
          { title: 'Built-in (runs code)', value: 'builtin' },
        ],
        layout: 'radio',
      },
      initialValue: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'builtinId',
      type: 'string',
      title: 'Which built-in',
      description:
        'Ties this command to code in the site. Adding a new value here does nothing until the site implements it.',
      options: {
        list: [
          { title: 'Snake (game)', value: 'snake' },
          { title: 'Clear the screen', value: 'clear' },
          { title: 'Help listing', value: 'help' },
          { title: 'Open a link', value: 'open' },
        ],
      },
      hidden: ({ parent }) => parent?.kind !== 'builtin',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const kind = (context.parent as { kind?: string } | undefined)?.kind;
          if (kind === 'builtin' && !value) return 'Pick which built-in this command runs.';
          return true;
        }),
    }),
    defineField({
      name: 'url',
      type: 'url',
      title: 'URL to open',
      description: 'Where the "Open a link" built-in sends the visitor.',
      hidden: ({ parent }) => parent?.builtinId !== 'open',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { builtinId?: string } | undefined;
          if (parent?.builtinId === 'open' && !value) return 'Give the URL to open.';
          return true;
        }),
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
      hidden: ({ parent }) => parent?.kind === 'builtin',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'description', kind: 'kind' },
    prepare: ({ title, subtitle, kind }) => ({
      title,
      subtitle: kind === 'builtin' ? `built-in · ${subtitle ?? ''}` : subtitle,
    }),
  },
});
