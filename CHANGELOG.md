# Changelog

## [0.1.34] - 2025-11-22

### Fixed

- Corrected the comment submission and approval flow by aligning the database schema with the API logic. The `approved` field is now consistently handled as a number (`0` or `1`) across the entire application, resolving issues with TypeScript types and ensuring reliable communication with the Turso database.

## [0.1.33] - 2025-11-212

### Fixed
- **Category Counter:** The category post counter now correctly counts all posts, including those without a specified language.
- **Blog Pagination:** The blog pagination now works correctly, properly calculating the total number of pages and distributing posts across them.