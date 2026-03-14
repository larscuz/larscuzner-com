CREATE TABLE IF NOT EXISTS cms_workspace_entries (
  id VARCHAR(191) PRIMARY KEY,
  source_id BIGINT NOT NULL,
  kind VARCHAR(32) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  original_status VARCHAR(32) NOT NULL,
  workflow_status VARCHAR(32) NOT NULL,
  excerpt LONGTEXT NOT NULL,
  body LONGTEXT NOT NULL,
  public_url TEXT NOT NULL,
  term_labels JSON NOT NULL,
  linked_attachment_ids JSON NOT NULL,
  notes LONGTEXT NOT NULL,
  updated_at DATETIME NOT NULL
);
