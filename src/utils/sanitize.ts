/**
 * Sanitize a string value for use in YAML front matter
 * Escapes special characters that could cause YAML parsing issues
 *
 * @param value The string value to sanitize
 * @returns Sanitized string safe for YAML front matter
 */
export function sanitizeFrontMatterValue(value: string): string {
  if (!value) return "";

  // Escape quotes to prevent YAML parsing issues
  let sanitized = value.replace(/"/g, '\\"');

  // Escape other special characters that might cause issues
  sanitized = sanitized
    .replace(/:/g, "\\:")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\|/g, "\\|");

  return sanitized;
}

/**
 * Sanitize an ID for use in front matter or URLs
 * Removes special characters and replaces spaces with dashes
 *
 * @param value The string value to sanitize as an ID
 * @returns Sanitized ID string
 */
export function sanitizeId(value: string): string {
  if (!value) return "";

  // Replace spaces and special characters with dashes
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "-")
    .replace(/-+/g, "-") // Replace multiple consecutive dashes with a single dash
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing dashes
}
