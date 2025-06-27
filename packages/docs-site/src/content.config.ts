/**
 * @module content.config
 * 
 * Content collection configuration for the Terroir Core Design System documentation.
 * 
 * Defines how Astro processes and validates documentation content:
 * - Uses Starlight's document loader for MDX processing
 * - Applies Starlight's schema for frontmatter validation
 * - Enables type-safe content handling
 * 
 * The docs collection supports:
 * - MDX content with components
 * - Frontmatter metadata (title, description, etc.)
 * - Auto-generated navigation
 * - Search indexing
 * - Syntax highlighting
 * 
 * Content is stored in src/content/docs/ and organized by category.
 */

import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
