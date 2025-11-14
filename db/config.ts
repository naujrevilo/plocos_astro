import { NOW, column, defineDb, defineTable } from 'astro:db';

const Comments = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    postSlug: column.text(),
    locale: column.text(),
    name: column.text(),
    email: column.text({ optional: true }),
    message: column.text(),
    createdAt: column.date({ default: NOW }),
    approved: column.boolean({ default: false }),
  },
  indexes: [{ on: ['postSlug', 'locale', 'approved'] }],
});

export default defineDb({
  tables: { Comments },
});
