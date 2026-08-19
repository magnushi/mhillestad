import { defineField, defineType } from 'sanity';

// A message left by a visitor through the `contact` command.
//
// These live in the private `inbox` dataset, never in `production`. The content
// dataset is public — anyone can read all of it with no token — so a name and
// an email address written there would be published, not stored. Keep this type
// out of the default workspace.
//
// The submitted fields are read-only: they are a record of what someone sent,
// not copy to be edited. `handled` is the one field that is yours.
export const contactMessage = defineType({
  name: 'contactMessage',
  type: 'document',
  title: 'Message',
  description: 'Sent by a visitor through the `contact` command on the site.',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Name', readOnly: true }),
    defineField({ name: 'email', type: 'string', title: 'Email', readOnly: true }),
    defineField({ name: 'message', type: 'text', title: 'Message', rows: 8, readOnly: true }),
    defineField({
      name: 'submittedAt',
      type: 'datetime',
      title: 'Submitted',
      description: 'Stamped by the server, not the browser.',
      readOnly: true,
    }),
    defineField({
      name: 'handled',
      type: 'boolean',
      title: 'Handled',
      description: 'Tick once you have replied, so the unhandled list stays useful.',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      name: 'submittedDesc',
      title: 'Newest first',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      name: 'name',
      email: 'email',
      message: 'message',
      submittedAt: 'submittedAt',
      handled: 'handled',
    },
    prepare: ({ name, email, message, submittedAt, handled }) => ({
      title: `${handled ? '' : '· '}${name ?? 'Anonymous'} <${email ?? 'no email'}>`,
      subtitle: [submittedAt?.slice(0, 10), (message ?? '').replace(/\s+/g, ' ').slice(0, 80)]
        .filter(Boolean)
        .join(' — '),
    }),
  },
});
