import { defineArrayMember } from 'sanity';

// Shared body definition for anything the terminal prints: command output and
// landing pages. Kept in one place so a page and a command render identically.
export const terminalBody = [
  defineArrayMember({
    type: 'block',
    styles: [{ title: 'Normal', value: 'normal' }],
    lists: [],
    marks: {
      decorators: [],
      annotations: [{ type: 'terminalLink' }, { type: 'runCommand' }],
    },
  }),
  defineArrayMember({ type: 'investmentTable' }),
  defineArrayMember({ type: 'entryList' }),
  defineArrayMember({ type: 'bookList' }),
];
