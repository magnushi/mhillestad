import { defineField, defineType } from 'sanity';

// One line in the `blog` listing, pointing at something published elsewhere.
// Posts, talks and press are the same shape — a date, a title, a link — so they
// are one type with a `kind` rather than three the site would have to merge.
//
// Writing published *here* is a `blogPost` instead: it holds the words and gets
// a page. The split is by where the writing lives, not by what it is.
//
// Order is NOT editorial: entries sort by `date`, unlike investments and
// commands, which are dragged into place on the Home page.
export const entry = defineType({
  name: 'entry',
  type: 'document',
  title: 'Blog entry',
  description:
    'Something of yours published elsewhere: a post, a talk or video, or press you were interviewed in. Listed newest first by date — there is nothing to drag. For a post written on this site, make a Blog post instead.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'kind',
      type: 'string',
      title: 'Kind',
      description:
        'Shown as a tag in the listing, so a piece you wrote never looks like a piece written about you.',
      options: {
        list: [
          { title: 'Post — you wrote it', value: 'post' },
          { title: 'Talk — a video, keynote or podcast', value: 'talk' },
          { title: 'Press — someone interviewed you', value: 'press' },
        ],
        layout: 'radio',
      },
      initialValue: 'post',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      type: 'date',
      title: 'Date',
      description: 'When it was published. This is what the listing sorts by.',
      options: { dateFormat: 'YYYY-MM-DD' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'outlet',
      type: 'string',
      title: 'Where it appeared',
      description: 'The publication, channel or show, e.g. "sanity.io", "TechCrunch", "YouTube".',
    }),
    defineField({
      name: 'url',
      type: 'url',
      title: 'URL',
      description: 'Where this lives on the web.',
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      name: 'dateDesc',
      title: 'Newest first',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', date: 'date', kind: 'kind', outlet: 'outlet' },
    prepare: ({ title, date, kind, outlet }) => ({
      title,
      subtitle: [date, kind, outlet].filter(Boolean).join(' · '),
    }),
  },
});
