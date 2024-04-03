# Multi-User Basic Auth

## Why Multi-user Auth?

Multi-user authentication can be crucial for several reasons. Let's delve into this topic.

**Security**—The primary concern is the security of your deployments. You need to control who can access your data and
ensure they are authorized to do so. You may wonder, since Chroma offers basic and token-based authentication, why is
multi-user authentication necessary?

You should never share your Chroma access credentials with your users or any app that depends on Chroma. The answer to
this concern is a categorical NO.

Another reason to consider multi-user authentication is to differentiate access to your data. However, the solution
presented here doesn't provide this. It's a stepping stone towards our upcoming article on multi-tenancy and securing
Chroma data.

Last but not least is auditing. While we acknowledge this is not for everybody, there is ~~an~~ increasing pressure to
provide visibility into your app via auditable events.

Multi-user experiences - Not all GenAI apps are intended to be private or individual. This is another reason to consider
and implement multi-user authentication and authorization.

## Dive right in.

Let's get straight to the point and build a multi-user authorization with basic authentication. Here's our goal:

- Develop a server-side authorization provider that can read multiple users from a `.htpasswd` file
- Generate a multi-user `.htpasswd` file with several test users
- Package our plugin with the Chroma base image and execute it using Docker Compose

!!! note  "Auth CIP"

    Chroma has [detailed info](https://github.com/chroma-core/chroma/blob/main/docs/CIP_2_Auth_Providers_Proposal.md) about how its
    authentication and authorization are implemented. Should you want to learn more go read the CIP (Chroma Improvement Proposal doc).

### The Plugin

```python
import importlib
import logging
from typing import Dict, cast, TypeVar, Optional

from chromadb.auth import (
    ServerAuthCredentialsProvider,
    AbstractCredentials,
    SimpleUserIdentity,
)
from chromadb.auth.registry import register_provider
from chromadb.config import System
from chromadb.telemetry.opentelemetry import (
    OpenTelemetryGranularity,
    trace_method,
    add_attributes_to_current_span,
)
from pydantic import SecretStr
from overrides import override

T = TypeVar("T")

logger = logging.getLogger(__name__)


@register_provider("multi_user_htpasswd_file")
class MultiUserHtpasswdFileServerAuthCredentialsProvider(ServerAuthCredentialsProvider):
    _creds: Dict[str, SecretStr]  # contains user:password-hash

    def __init__(self, system: System) -> None:
        super().__init__(system)
        try:
            self.bc = importlib.import_module("bcrypt")
        except ImportError:
            raise ValueError(
                "The bcrypt python package is not installed. "
                "Please install it with `pip install bcrypt`"
            )
        system.settings.require("chroma_server_auth_credentials_file")
        _file = str(system.settings.chroma_server_auth_credentials_file)
        self._creds = dict()
        with open(_file, "r") as f:
            for line in f:
                _raw_creds = [v for v in line.strip().split(":")]
                if len(_raw_creds) != 2:
                    raise ValueError(
                        "Invalid Htpasswd credentials found in "
                        f"[{str(system.settings.chroma_server_auth_credentials_file)}]. "
                        "Must be <username>:<bcrypt passwd>."
                    )
                self._creds[_raw_creds[0]] = SecretStr(_raw_creds[1])

    @trace_method(  # type: ignore
        "MultiUserHtpasswdFileServerAuthCredentialsProvider.validate_credentials",
        OpenTelemetryGranularity.ALL,
    )
    @override
    def validate_credentials(self, credentials: AbstractCredentials[T]) -> bool:
        _creds = cast(Dict[str, SecretStr], credentials.get_credentials())

        if len(_creds) != 2 or "username" not in _creds or "password" not in _creds:
            logger.error(
                "Returned credentials did match expected format: "
                "dict[username:SecretStr, password: SecretStr]"
            )
            add_attributes_to_current_span(
                {
                    "auth_succeeded": False,
                    "auth_error": "Returned credentials did match expected format: "
                                  "dict[username:SecretStr, password: SecretStr]",
                }
            )
            return False  # early exit on wrong format
        _user_pwd_hash = (
            self._creds[_creds["username"].get_secret_value()]
            if _creds["username"].get_secret_value() in self._creds
            else None
        )
        validation_response = _user_pwd_hash is not None and self.bc.checkpw(
            _creds["password"].get_secret_value().encode("utf-8"),
            _user_pwd_hash.get_secret_value().encode("utf-8"),
        )
        add_attributes_to_current_span(
            {
                "auth_succeeded": validation_response,
                "auth_error": f"Failed to validate credentials for user {_creds['username'].get_secret_value()}"
                if not validation_response
                else "",
            }
        )
        return validation_response

    @override
    def get_user_identity(
            self, credentials: AbstractCredentials[T]
    ) -> Optional[SimpleUserIdentity]:
        _creds = cast(Dict[str, SecretStr], credentials.get_credentials())
        return SimpleUserIdentity(_creds["username"].get_secret_value())

```

In less than 80 lines of code, we have our plugin. Let's delve into and explain some of the key points of the code
above:

- `__init__` - Here, we dynamically import bcrypt, which we'll use to check user credentials. We also read the
  configured credentials file - `server.htpasswd` line by line, to retrieve each user (we assume each line contains a
  new user with its bcrypt hash).
- `validate_credentials` - This is where the magic happens. We initially perform some lightweight validations on the
  credentials parsed by Chroma and passed to the plugin. Then, we attempt to retrieve the user and its hash from
  the `_creds` dictionary. The final step is to verify the hash. We've also added some attributes to monitor our
  authentication process in our observability layer (we have an upcoming article about this).
- `get_user_identity` - Constructs a simple user identity, which the authorization plugin uses to verify permissions.
  Although not needed for now, each authentication plugin must implement this, as user identities are crucial for
  authorization.

We'll store our plugin in `__init__.py` within the following directory
structure - `chroma_auth/authn/basic/__init__.py` (refer to the repository for details).

### Password file

Now that we have our plugin let’s create a password file with a few users:

Initial user:

```bash
echo "password123" | htpasswd -iBc server.htpasswd admin
```

The above will create (`-c` flag) a new server.htpasswd file with initial user `admin` and the password will be read
from stdin (`-i` flag) and saved as bcrypt hash (`-B` flag)

Let’s add another user:

```bash
echo "password123" | htpasswd -iB server.htpasswd user1
```

Now our `server.htpasswd` file will look like this:

```bash
admin:$2y$05$vkBK4b1Vk5O98jNHgr.uduTJsTOfM395sKEKe48EkJCVPH/MBIeHK
user1:$2y$05$UQ0kC2x3T2XgeN4WU12BdekUwCJmLjJNhMaMtFNolYdj83OqiEpVu
```

Moving on to docker setup.

### Docker compose setup

Let’s create a `Dockerfile` to bundle our plugin with the official Chroma image:

```docker
ARG CHROMA_VERSION=0.4.24
FROM ghcr.io/chroma-core/chroma:${CHROMA_VERSION} as base

COPY chroma_auth/ /chroma/chroma_auth
```

This will pick up the official docker image for Chroma and will add our plugin directory structure so that we can use
it.

Now let’s create an `.env` file to load our plugin:

```bash
CHROMA_SERVER_AUTH_PROVIDER="chromadb.auth.basic.BasicAuthServerProvider"
CHROMA_SERVER_AUTH_CREDENTIALS_FILE="server.htpasswd"
CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER="chroma_auth.authn.basic.MultiUserHtpasswdFileServerAuthCredentialsProvider"
```

And finally our `docker-compose.yaml`:

```yaml
version: '3.9'

networks:
  net:
    driver: bridge

services:
  server:
    image: chroma-server
    build:
      dockerfile: Dockerfile
    volumes:
      - ./chroma-data:/chroma/chroma
      - ./server.htpasswd:/chroma/server.htpasswd
    command: "--workers 1 --host 0.0.0.0 --port 8000 --proxy-headers --log-config chromadb/log_config.yml --timeout-keep-alive 30"
    environment:
      - IS_PERSISTENT=TRUE
      - CHROMA_SERVER_AUTH_PROVIDER=${CHROMA_SERVER_AUTH_PROVIDER}
      - CHROMA_SERVER_AUTH_CREDENTIALS_FILE=${CHROMA_SERVER_AUTH_CREDENTIALS_FILE}
      - CHROMA_SERVER_AUTH_CREDENTIALS=${CHROMA_SERVER_AUTH_CREDENTIALS}
      - CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER=${CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER}
      - CHROMA_SERVER_AUTH_TOKEN_TRANSPORT_HEADER=${CHROMA_SERVER_AUTH_TOKEN_TRANSPORT_HEADER}
      - PERSIST_DIRECTORY=${PERSIST_DIRECTORY:-/chroma/chroma}
      - CHROMA_OTEL_EXPORTER_ENDPOINT=${CHROMA_OTEL_EXPORTER_ENDPOINT}
      - CHROMA_OTEL_EXPORTER_HEADERS=${CHROMA_OTEL_EXPORTER_HEADERS}
      - CHROMA_OTEL_SERVICE_NAME=${CHROMA_OTEL_SERVICE_NAME}
      - CHROMA_OTEL_GRANULARITY=${CHROMA_OTEL_GRANULARITY}
      - CHROMA_SERVER_NOFILE=${CHROMA_SERVER_NOFILE}
    restart: unless-stopped # possible values are: "no", always", "on-failure", "unless-stopped"
    ports:
      - "8000:8000"
    healthcheck:
      # Adjust below to match your container port
      test: [ "CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat" ]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - net

```

### The test

Let’s run our docker compose setup:

```yaml
docker compose --env-file ./.env up --build
```

You *should* see the following log message if the plugin was successfully loaded:

```bash
server-1  | DEBUG:    [01-04-2024 14:10:13] Starting component MultiUserHtpasswdFileServerAuthCredentialsProvider
server-1  | DEBUG:    [01-04-2024 14:10:13] Starting component BasicAuthServerProvider
server-1  | DEBUG:    [01-04-2024 14:10:13] Starting component FastAPIChromaAuthMiddleware

```

Once our container is up and running, let’s see if our multi-user auth works:

```bash
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",chroma_client_auth_credentials="admin:password123"))
client.heartbeat()  # this should work with or without authentication - it is a public endpoint
client.get_or_create_collection("test_collection")  # this is a protected endpoint and requires authentication
client.list_collections()  # this is a protected endpoint and requires authentication
```

The above code should return the list of collections, a single collection `test_collection` that we created.

```bash
(chromadb-multi-user-basic-auth-py3.11) [chromadb-multi-user-basic-auth]python                                                                                                                                                                                                            19:51:38  ☁  main ☂ ⚡ ✚
Python 3.11.7 (main, Dec 30 2023, 14:03:09) [Clang 15.0.0 (clang-1500.1.0.2.5)] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> import chromadb
>>> from chromadb.config import Settings
>>> 
>>> client = chromadb.HttpClient(
...     settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",chroma_client_auth_credentials="admin:password123"))
>>> client.heartbeat()  # this should work with or without authentication - it is a public endpoint
1711990302270211007
>>> 
>>> client.list_collections()  # this is a protected endpoint and requires authentication
[]
```

Great, now let’s test for our other user:

```bash
client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",chroma_client_auth_credentials="user1:password123"))
```

Works just as well (logs omitted for brevity).

To ensure that our plugin works as expected let’s also test with an user that is not in our `server.htpasswd` file:

```bash
client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",chroma_client_auth_credentials="invalid_user:password123"))
```

```bash
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/Users/tazarov/Library/Caches/pypoetry/virtualenvs/chromadb-multi-user-basic-auth-vIZuPNTE-py3.11/lib/python3.11/site-packages/chromadb/__init__.py", line 197, in HttpClient
    return ClientCreator(tenant=tenant, database=database, settings=settings)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/tazarov/Library/Caches/pypoetry/virtualenvs/chromadb-multi-user-basic-auth-vIZuPNTE-py3.11/lib/python3.11/site-packages/chromadb/api/client.py", line 144, in __init__
    self._validate_tenant_database(tenant=tenant, database=database)
  File "/Users/tazarov/Library/Caches/pypoetry/virtualenvs/chromadb-multi-user-basic-auth-vIZuPNTE-py3.11/lib/python3.11/site-packages/chromadb/api/client.py", line 445, in _validate_tenant_database
    raise e
  File "/Users/tazarov/Library/Caches/pypoetry/virtualenvs/chromadb-multi-user-basic-auth-vIZuPNTE-py3.11/lib/python3.11/site-packages/chromadb/api/client.py", line 438, in _validate_tenant_database
    self._admin_client.get_tenant(name=tenant)
  File "/Users/tazarov/Library/Caches/pypoetry/virtualenvs/chromadb-multi-user-basic-auth-vIZuPNTE-py3.11/lib/python3.11/site-packages/chromadb/api/client.py", line 486, in get_tenant
    return self._server.get_tenant(name=name)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/tazarov/Library/Caches/pypoetry/virtualenvs/chromadb-multi-user-basic-auth-vIZuPNTE-py3.11/lib/python3.11/site-packages/chromadb/telemetry/opentelemetry/__init__.py", line 127, in wrapper
    return f(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^
  File "/Users/tazarov/Library/Caches/pypoetry/virtualenvs/chromadb-multi-user-basic-auth-vIZuPNTE-py3.11/lib/python3.11/site-packages/chromadb/api/fastapi.py", line 200, in get_tenant
    raise_chroma_error(resp)
  File "/Users/tazarov/Library/Caches/pypoetry/virtualenvs/chromadb-multi-user-basic-auth-vIZuPNTE-py3.11/lib/python3.11/site-packages/chromadb/api/fastapi.py", line 649, in raise_chroma_error
    raise chroma_error
chromadb.errors.AuthorizationError: Unauthorized

```

As expected, we get auth error when trying to connect to Chroma (the client initialization validates the tenant and DB
which are both protected endpoints which raises the exception above).
