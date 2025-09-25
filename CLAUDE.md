# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the Chroma Cookbook - a collection of guides, recipes, and documentation for using, deploying, and troubleshooting ChromaDB. Built with MkDocs Material theme.

## Common Development Commands

### Documentation Development
```bash
# Serve docs locally with hot reload
mkdocs serve

# Build static documentation site
mkdocs build

# Deploy to GitHub Pages
mkdocs gh-deploy
```

### Git Workflow
- Main branch: `main`
- Current working branch: `trayan-08-20-feat_bump_version_and_fix_cors_strategy_for_1.0_`
- Use conventional commits format

## Project Structure

The cookbook is organized as a MkDocs documentation site:

- `/docs/` - All documentation content organized by topic:
  - `/core/` - Core ChromaDB concepts, installation, API reference
  - `/running/` - Deployment patterns, maintenance, performance tips
  - `/security/` - Authentication, SSL, security best practices
  - `/strategies/` - Implementation patterns (multi-tenancy, memory management, etc.)
  - `/integrations/` - LangChain, LlamaIndex, Ollama integrations
  - `/recipes/` - Specific use-case implementations
  - `/embeddings/` - Embedding models and GPU support
  - `/ecosystem/` - Client libraries and community tools
- `/notebooks/` - Jupyter notebooks with examples (currently contains ssl-proxies.ipynb)
- `mkdocs.yml` - MkDocs configuration with Material theme settings

## Documentation Guidelines

- Documentation uses Markdown with MkDocs Material extensions (admonition, pymdownx, etc.)
- Code snippets support syntax highlighting and copy buttons
- Latest ChromaDB version tracked in index.md: 1.0.20
- New content should follow existing patterns in respective directories
- Use admonitions for notes, warnings, and tips
- Include practical examples and code snippets where applicable

## Key Topics Covered

- ChromaDB 1.0.x migration and features
- Authentication and security configurations
- Deployment patterns (Docker, Kubernetes, systemd)
- Performance optimization and maintenance
- Multi-tenancy strategies
- Integration with popular AI frameworks
- Client libraries in multiple languages