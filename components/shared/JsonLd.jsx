/**
 * Renders a JSON-LD structured data script tag.
 * @param {{ data: object }} props
 */
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
