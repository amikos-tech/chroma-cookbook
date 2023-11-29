# Useful Shortcuts for Contributors

## Git

## Aliases

### Create venv and install dependencies

Add the following to your `.bashrc`, `.zshrc` or `.profile`:

```bash
alias chroma-init='python -m virtualenv venv && source venv/bin/activate && pip install -r requirements.txt && pip install -r requirements_dev.txt'
```
