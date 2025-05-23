/**
 * Utility functions for working with markdown content in documentation
 */

import { sanitizeFrontMatterValue, sanitizeId } from './sanitize';
import path from 'path';

/**
 * Add Docusaurus front matter to markdown content
 * @param content The markdown content
 * @param id The document ID for routing
 * @param title The document title
 * @param position The sidebar position
 * @returns Markdown content with front matter
 */
export function addFrontMatter(
  content: string,
  id: string,
  title: string,
  position: number = 1
): string {
  // Sanitize id using the dedicated sanitizeId function
  const sanitizedId = sanitizeId(id);
  
  // Sanitize title using the dedicated sanitizeFrontMatterValue function
  const sanitizedTitle = sanitizeFrontMatterValue(title);
  
  // Create front matter block with properly sanitized values
  const frontMatter = `---
id: ${sanitizedId}
title: "${sanitizedTitle}"
sidebar_position: ${position}
---

`;

  // Add front matter to content
  return frontMatter + content;
}

/**
 * Extract title from markdown content
 * @param content The markdown content
 * @returns The extracted title or null if not found
 */
export function extractMarkdownTitle(content: string): string | null {
  // Look for a level 1 heading (# Title)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  // Look for a title in front matter
  const frontMatterMatch = content.match(/---\s+(?:.*\n)*title:\s*["']?([^"'\n]+)["']?/);
  if (frontMatterMatch && frontMatterMatch[1]) {
    return frontMatterMatch[1].trim();
  }
  
  return null;
}

/**
 * Convert a string to a valid markdown filename
 * @param input The input string
 * @returns A valid markdown filename
 */
export function toMarkdownFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '.md';
}

/**
 * Create a table of contents for markdown content
 * @param content The markdown content
 * @returns A markdown table of contents
 */
export function generateTableOfContents(content: string): string {
  const headings: { level: number; text: string; anchor: string }[] = [];
  
  // Find all headings (## Heading)
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    
    // Create anchor (lowercase, replace spaces with dashes)
    const anchor = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    
    headings.push({ level, text, anchor });
  }
  
  // Generate TOC markdown
  if (headings.length === 0) {
    return '';
  }
  
  let toc = '## Table of Contents\n\n';
  
  headings.forEach(heading => {
    // Add indentation based on heading level
    const indent = '  '.repeat(heading.level - 2);
    toc += `${indent}- [${heading.text}](#${heading.anchor})\n`;
  });
  
  return toc + '\n';
}

/**
 * Check if content is valid markdown
 * @param content The content to check
 * @returns True if the content is valid markdown
 */
export function isValidMarkdown(content: string): boolean {
  // Basic check for markdown syntax
  const markdownPatterns = [
    /^#\s+.+$/m,           // Headings
    /\*\*.+\*\*/,           // Bold
    /\*.+\*/,               // Italic
    /\[.+\]\(.+\)/,         // Links
    /```[\s\S]+```/,        // Code blocks
    /^\s*-\s+.+$/m,         // Lists
    /^\s*\d+\.\s+.+$/m,     // Numbered lists
    />\s+.+/,               // Blockquotes
    /\|.+\|.+\|/,           // Tables
    /!\[.+\]\(.+\)/         // Images
  ];
  
  // Check if any markdown patterns are found
  return markdownPatterns.some(pattern => pattern.test(content));
}

/**
 * Generate markdown content from a template
 * @param templateName The name of the template to use
 * @param data The data to populate the template with
 * @returns The generated markdown content
 */
export function generateMarkdownFromTemplate(templateName: string, data: Record<string, any>): string {
  // Template definitions
  const templates: Record<string, (data: Record<string, any>) => string> = {
    'feature-overview': (data) => {
      const { features, featureUrls, generatedAt } = data;
      
      let markdown = "# Code Documentation Overview\n\n";
      
      markdown += `Generated on: ${new Date(generatedAt).toLocaleString()}\n\n`;
      
      markdown += "## Features\n\n";
      
      features.forEach((feature: string) => {
        const url = featureUrls[feature] || '#';
        markdown += `- [${feature}](${url})\n`;
      });
      
      return markdown;
    },
    
    'feature-detail': (data) => {
      const { feature, files, content } = data;
      
      let markdown = `# ${feature} Feature\n\n`;
      
      if (content) {
        markdown += content;
      } else {
        markdown += "## Overview\n\nThis feature contains the following files:\n\n";
        
        files.forEach((file: string) => {
          markdown += `- \`${file}\`\n`;
        });
      }
      
      return markdown;
    }
  };
  
  // Check if template exists
  if (!templates[templateName]) {
    throw new Error(`Template '${templateName}' not found`);
  }
  
  // Generate markdown from template
  return templates[templateName](data);
}
