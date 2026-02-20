# Getting Started with Contributing to Chroma

## Overview

Here are some steps to follow:

- Fork the repository (if you are part of an organization to which you cannot grant permissions it might be advisable to fork under your own user account to allow other community members to contribute by granting them permissions, something that is a bit more difficult at organizational level)
- Clone your forked repo locally (git clone ...) under a dir with an apt name for the change you want to make e.g. `my_awesome_feature`
- Create a branch for your change (git checkout -b my_awesome_feature)
- Make your changes
- Test (see [Testing](#testing))
- Lint (see [Linting](#linting))
- Commit your changes (git commit -am 'Added some feature')
- Push to the branch (git push origin my_awesome_feature)
- Create a new Pull Request (PR) from your forked repository to the main Chroma repository

## Testing

It is generally good to test your changes before submitting a PR.

To run the full test suite:

```bash
pip install -r requirements_dev.txt
pytest
```

To run a specific test:

```bash
pytest chromadb/tests/test_api.py::test_get_collection
```

If you want to see the output of print statements in the tests, you can run:

```bash
pytest -s
```

If you want your pytest to stop on first failure, you can run:

```bash
pytest -x
```

### Integration Tests

You can only run the integration tests by running:

```bash
sh bin/bin/integration-test
```

The above will create a docker container and will run the integration tests against it. This will also include JS client.

## Linting
