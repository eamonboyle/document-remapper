# Test data for uploads and remapping

These files exercise the formats the app accepts (see UploadThing MIME list and local picker on the home page): **CSV**, **TSV**, **JSON Lines**, nested **JSON**, and **XML**.

| File | Use this to try |
|------|----------------|
| `sample-contacts.csv` | Column rename / tabular remap (clear header names). |
| `sample-contacts.tsv` | TSV delimiter + different column names than CSV. |
| `sample-contacts.jsonl` | One JSON object per line → tabular view. |
| `sample-contacts-nested.json` | Dot-path fields (`people.0.address.email_primary`, nested objects, arrays). |
| `sample-contacts.xml` | XML tree → flattened paths with attributes (`@_*` prefixes from parser). |

**Excel (`.xlsx`)**: Not committed as binary here; save any CSV above as XLSX in a spreadsheet app to try the Excel path.

Uses small, fake companies and emails only (`example.com`).
