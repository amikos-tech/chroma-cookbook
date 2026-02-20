# Implementing OpenFGA Authorization Model In Chroma

Source Code

The source code for this article can be found [here](https://github.com/amikos-tech/chromadb-auth).

## Preparation

To make things useful we also introduce an initial tuple set with permissions which will allows us to test the authorization model.

We define three users:

- `admin` part of `chroma` team as `owner`
- `user1` part of `chroma` team as `reader`
- `admin-ext` part of `external` team as `owner`

We will give enough permissions to these three users and their respective teams so that they can perform collection creation, deletion, add records, remove records, get records and query records in the context of their role within the team - `owner` has access to all API actions while `reader` can only read, list get, query.

Abbreviate Example

We have removed some of the data from the above example for brevity. The full tuple set can be found under data/data/initial-data.json

```json
[
  {
    "object": "team:chroma",
    "relation": "owner",
    "user": "user:admin"
  },
  {
    "object": "team:chroma",
    "relation": "reader",
    "user": "user:user1"
  },
  {
    "object": "team:external",
    "relation": "owner",
    "user": "user:admin-ext"
  },
  {
    "object": "server:localhost",
    "relation": "can_get_tenant",
    "user": "team:chroma#owner"
  },
  {
    "object": "tenant:default_tenant-default_database",
    "relation": "can_get_database",
    "user": "team:chroma#owner"
  },
  {
    "object": "database:default_tenant-default_database",
    "relation": "can_create_collection",
    "user": "team:chroma#owner"
  },
  {
    "object": "database:default_tenant-default_database",
    "relation": "can_list_collections",
    "user": "team:chroma#owner"
  },
  {
    "object": "database:default_tenant-default_database",
    "relation": "can_get_or_create_collection",
    "user": "team:chroma#owner"
  },
  {
    "object": "database:default_tenant-default_database",
    "relation": "can_count_collections",
    "user": "team:chroma#owner"
  }
]
```

## Testing the model

Let’s spin up a quick docker compose to test our setup. In the repo we have provided `openfga/docker-compose.openfga-standalone.yaml`

```bash
docker compose -f openfga/docker-compose.openfga-standalone.yaml up
```

For this next part ensure you have FGA CLI installed.

Once the containers are up and running let’s create a store and import the model:

```bash
export FGA_API_URL=http://localhost:8082 # our OpenFGA binds to 8082 on localhost
fga store create --model data/models/model-article-p4.fga --name chromadb-auth
```

You should see a response like this:

```json
{
  "store": {
    "created_at": "2024-04-09T18:37:26.367747Z",
    "id": "01HV3VB347NPY3NMX6VQ5N2E23",
    "name": "chromadb-auth",
    "updated_at": "2024-04-09T18:37:26.367747Z"
  },
  "model": {
    "authorization_model_id": "01HV3VB34JAXWF0F3C00DFBZV4"
  }
}
```

Let’s import our initial tuple set. Before that make sure to export `FGA_STORE_ID` and `FGA_MODEL_ID` as per the output of the previous command:

```bash
export FGA_STORE_ID=01HV3VB347NPY3NMX6VQ5N2E23
export FGA_MODEL_ID=01HV3VB34JAXWF0F3C00DFBZV4
fga tuple write --file data/data/initial-data.json
```

Let’s test our imported model and tuples:

```bash
fga query check user:admin can_get_preflight server:localhost
```

If everything is working you should see this:

```json
{
  "allowed": true,
  "resolution": ""
}
```

## Implementing Authorization Plumbing in Chroma

First we will start with making a few small changes to the authorization plugin we’ve made. Why you ask? We need to introduce teams (aka groups). For that we’ll resort to standard Apache `groupfile` as follows:

```json
chroma: admin, user1
external: admin-ext
```

The `groupfile` will be mounted to our Chroma container and read by the multi-user basic auth plugin. The changes to the authentication plugin are as follows:

```python
# imports as before

@register_provider("multi_user_htpasswd_file")
class MultiUserHtpasswdFileServerAuthCredentialsProvider(ServerAuthCredentialsProvider):
    _creds: Dict[str, SecretStr]  # contains user:password-hash

    def __init__(self, system: System) -> None:
        super().__init__(system)
        try:
            self.bc = importlib.import_module("bcrypt")
        except ImportError:
            raise ValueError(aa
                "The bcrypt python package is not installed. "
                "Please install it with `pip install bcrypt`"
            )
        system.settings.require("chroma_server_auth_credentials_file")
        _file = str(system.settings.chroma_server_auth_credentials_file)
        ...  # as before
        _basepath = path.dirname(_file)
        self._user_group_map = dict()
        if path.exists(path.join(_basepath, "groupfile")):
            _groups = dict()
            with open(path.join(_basepath, "groupfile"), "r") as f:
                for line in f:
                    _raw_group = [v for v in line.strip().split(":")]
                    if len(_raw_group) < 2:
                        raise ValueError(
                            "Invalid Htpasswd group file found in "
                            f"[{path.join(_basepath, 'groupfile')}]. "
                            "Must be <groupname>:<username1>,<username2>,...,<usernameN>."
                        )
                    _groups[_raw_group[0]] = [u.strip() for u in _raw_group[1].split(",")]
                    for _group, _users in _groups.items():
                        for _user in _users:
                            if _user not in self._user_group_map:
                                self._user_group_map[_user] = _group

    @trace_method(  # type: ignore
        "MultiUserHtpasswdFileServerAuthCredentialsProvider.validate_credentials",
        OpenTelemetryGranularity.ALL,
    )
    @override
    def validate_credentials(self, credentials: AbstractCredentials[T]) -> bool:
        ...  # as before

    @override
    def get_user_identity(
            self, credentials: AbstractCredentials[T]
    ) -> Optional[SimpleUserIdentity]:
        _creds = cast(Dict[str, SecretStr], credentials.get_credentials())
        if _creds["username"].get_secret_value() in self._user_group_map.keys():
            return SimpleUserIdentity(
                _creds["username"].get_secret_value(),
                attributes={
                    "team": self._user_group_map[_creds["username"].get_secret_value()]
                },
            )
        return SimpleUserIdentity(_creds["username"].get_secret_value(), attributes={"team": "public"})
```

Full code

The code can be found under `chroma_auth/authn/basic/__**init__**.py`

We read the group file and for each user create a key in `self._user_group_map` to specify the group or team of that user. The information is returned as user identity attributes that is further used by the authz plugin.

Now let’s turn our attention to the authorization plugin. First let’s start with that we’re trying to achieve with it:

- Handle OpenFGA configuration from the import of the model as per the snippet above. This will help us to wire all necessary parts of the code with correct authorization model configuration.
- Map all existing Chroma authorization actions to our authorization model
- Adapt any shortcomings or quirks in Chroma authorization to the way OpenFGA works
- Implement the Enforcement Point (EP) logic
- Implement OpenFGA Permissions API wrapper - this is a utility class that will help us update and keep updating the OpenFGA tuples throughout collections’ lifecycle.

We’ve split the implementation in two files:

- `chroma_auth/authz/openfga/__init__.py` - Storing our OpenFGA authorization configuration reader and our authorization plugin that adapts to Chroma authz model and enforces authorization decisions
- `chroma_auth/authz/openfga/openfga_permissions.py` - Holds our OpenFGA permissions update logic.
- `chroma_auth/instr/**__init__**.py` - holds our adapted FastAPI server from Chroma `0.4.24`. While the authz plugin system in Chroma makes it easy to write the enforcement of authorization decisions, the update of permissions does require us to into this rabbit hole. Don’t worry the actual changes are minimal

Let’s cover things in a little more detail.

**Reading the configuration.**

```python
@register_provider("openfga_config_provider")
class OpenFGAAuthorizationConfigurationProvider(
    ServerAuthorizationConfigurationProvider[ClientConfiguration]
):
    _config_file: str
    _config: ClientConfiguration

    def __init__(self, system: System) -> None:
        super().__init__(system)
        self._settings = system.settings
        if "FGA_API_URL" not in os.environ:
            raise ValueError("FGA_API_URL not set")
        self._config = self._try_load_from_file()

        # TODO in the future we can also add credentials (preshared) or OIDC

    def _try_load_from_file(self) -> ClientConfiguration:
        store_id = None
        model_id = None
        if "FGA_STORE_ID" in os.environ and "FGA_MODEL_ID" in os.environ:
            return ClientConfiguration(
                api_url=os.environ.get("FGA_API_URL"),
                store_id=os.environ["FGA_STORE_ID"],
                authorization_model_id=os.environ["FGA_MODEL_ID"],
            )
        if "FGA_CONFIG_FILE" not in os.environ and not store_id and not model_id:
            raise ValueError("FGA_CONFIG_FILE or FGA_STORE_ID/FGA_MODEL_ID env vars not set")
        with open(os.environ["FGA_CONFIG_FILE"], "r") as f:
            config = json.load(f)
            return ClientConfiguration(
                api_url=os.environ.get("FGA_API_URL"),
                store_id=config["store"]["id"],
                authorization_model_id=config["model"]["authorization_model_id"],
            )

    @override
    def get_configuration(self) -> ClientConfiguration:
        return self._config
```

This is a pretty simple and straightforward implementation that will either take env variables for the FGA Server URL, Store and Model or it will only take the server ULR + json configuration (the same as above).

Next let’s have a look at our `OpenFGAAuthorizationProvider` implementation. We’ll start with the constructor where we adapt existing Chroma authorization actions to our model:

```python
def __init__(self, system: System) -> None:
    # more code here, but we're skipping for brevity
    self._authz_to_model_action_map = {
        AuthzResourceActions.CREATE_DATABASE.value: "can_create_database",
        AuthzResourceActions.GET_DATABASE.value: "can_get_database",
        AuthzResourceActions.CREATE_TENANT.value: "can_create_tenant",
        AuthzResourceActions.GET_TENANT.value: "can_get_tenant",
        AuthzResourceActions.LIST_COLLECTIONS.value: "can_list_collections",
        AuthzResourceActions.COUNT_COLLECTIONS.value: "can_count_collections",
        AuthzResourceActions.GET_COLLECTION.value: "can_get_collection",
        AuthzResourceActions.CREATE_COLLECTION.value: "can_create_collection",
        AuthzResourceActions.GET_OR_CREATE_COLLECTION.value: "can_get_or_create_collection",
        AuthzResourceActions.DELETE_COLLECTION.value: "can_delete_collection",
        AuthzResourceActions.UPDATE_COLLECTION.value: "can_update_collection",
        AuthzResourceActions.ADD.value: "can_add_records",
        AuthzResourceActions.DELETE.value: "can_delete_records",
        AuthzResourceActions.GET.value: "can_get_records",
        AuthzResourceActions.QUERY.value: "can_query_records",
        AuthzResourceActions.COUNT.value: "can_count_records",
        AuthzResourceActions.UPDATE.value: "can_update_records",
        AuthzResourceActions.UPSERT.value: "can_upsert_records",
        AuthzResourceActions.RESET.value: "can_reset",
    }

    self._authz_to_model_object_map = {
        AuthzResourceTypes.DB.value: "database",
        AuthzResourceTypes.TENANT.value: "tenant",
        AuthzResourceTypes.COLLECTION.value: "collection",
    }
```

> The above is located in `chroma_auth/authz/openfga/__init__.py`

The above is fairly straightforward mapping between `AuthzResourceActions` part of Chroma’s auth framework and the relations (aka actions) we’ve defined in our model above. Next we map also the `AuthzResourceTypes` to OpenFGA objects. This seem pretty simple right? Wrong, things are not so perfect and nothing exhibits this more than our next portion that takes the action and resource and returns object and relation to be checked:

```python
def resolve_resource_action(self, resource: AuthzResource, action: AuthzAction) -> tuple:
    attrs = ""
    tenant = None,
    database = None
    if "tenant" in resource.attributes:
        attrs += f"{resource.attributes['tenant']}"
        tenant = resource.attributes['tenant']
    if "database" in resource.attributes:
        attrs += f"-{resource.attributes['database']}"
        database = resource.attributes['database']
    if action.id == AuthzResourceActions.GET_TENANT.value or action.id == AuthzResourceActions.CREATE_TENANT.value:
        return "server:localhost", self._authz_to_model_action_map[action.id]
    if action.id == AuthzResourceActions.GET_DATABASE.value or action.id == AuthzResourceActions.CREATE_DATABASE.value:
        return f"tenant:{attrs}", self._authz_to_model_action_map[action.id]
    if action.id == AuthzResourceActions.CREATE_COLLECTION.value:
        try:
            cole_exists = self._api.get_collection(
                resource.id, tenant=tenant, database=database
            )
            return f"collection:{attrs}-{cole_exists.name}", self._authz_to_model_action_map[
                AuthzResourceActions.GET_COLLECTION.value]
        except Exception as e:
            return f"{self._authz_to_model_object_map[resource.type]}:{attrs}", self._authz_to_model_action_map[
                action.id]
    if resource.id == "*":
        return f"{self._authz_to_model_object_map[resource.type]}:{attrs}", self._authz_to_model_action_map[action.id]
    else:
        return f"{self._authz_to_model_object_map[resource.type]}:{attrs}-{resource.id}",
        self._authz_to_model_action_map[action.id]
```

Full code

The above is located in `chroma_auth/authz/openfga/__init__.py`

The `resolve_resource_action` function demonstrates the idiosyncrasies of Chroma’s auth. I have only myself to blame. The key takeaway is that there is room for improvement.

The actual authorization enforcement is then dead simple:

```python
def authorize(self, context: AuthorizationContext) -> bool:
    with OpenFgaClient(self._authz_config_provider.get_configuration()) as fga_client:
        try:
            obj, act = self.resolve_resource_action(resource=context.resource, action=context.action)
            resp = fga_client.check(body=ClientCheckRequest(
                user=f"user:{context.user.id}",
                relation=act,
                object=obj,
            ))
            # openfga_sdk.models.check_response.CheckResponse
            return resp.allowed
        except Exception as e:
            logger.error(f"Error while authorizing: {str(e)}")
            return False
```

At the end we’ll look at the our permissions API wrapper. While a full-blown solution will implement all possible object lifecycle hooks, we’re content with collections. Therefore we’ll add lifecycle callbacks for creating and deleting collection (we’re not considering, sharing of the collection with other users and change of ownership). So how does our create collection hook might look like you ask?

```python
def create_collection_permissions(self, collection: Collection, request: Request) -> None:
    if not hasattr(request.state, "user_identity"):
        return
    identity = request.state.user_identity  # AuthzUser
    tenant = request.query_params.get("tenant")
    database = request.query_params.get("database")
    _object = f"collection:{tenant}-{database}-{collection.id}"
    _object_for_get_collection = f"collection:{tenant}-{database}-{collection.name}"  # this is a bug in the Chroma Authz that feeds in the name of the collection instead of ID
    _user = f"team:{identity.get_user_attributes()['team']}#owner" if identity.get_user_attributes() and "team" in identity.get_user_attributes() else f"user:{identity.get_user_id()}"
    _user_writer = f"team:{identity.get_user_attributes()['team']}#writer" if identity.get_user_attributes() and "team" in identity.get_user_attributes() else None
    _user_reader = f"team:{identity.get_user_attributes()['team']}#reader" if identity.get_user_attributes() and "team" in identity.get_user_attributes() else None
    with OpenFgaClient(self._fga_configuration) as fga_client:
        fga_client.write_tuples(
            body=[
                ClientTuple(_user, "can_add_records", _object),
                ClientTuple(_user, "can_delete_records", _object),
                ClientTuple(_user, "can_update_records", _object),
                ClientTuple(_user, "can_get_records", _object),
                ClientTuple(_user, "can_upsert_records", _object),
                ClientTuple(_user, "can_count_records", _object),
                ClientTuple(_user, "can_query_records", _object),
                ClientTuple(_user, "can_get_collection", _object_for_get_collection),
                ClientTuple(_user, "can_delete_collection", _object_for_get_collection),
                ClientTuple(_user, "can_update_collection", _object),
            ]
        )
        if _user_writer:
            fga_client.write_tuples(
                body=[
                    ClientTuple(_user_writer, "can_add_records", _object),
                    ClientTuple(_user_writer, "can_delete_records", _object),
                    ClientTuple(_user_writer, "can_update_records", _object),
                    ClientTuple(_user_writer, "can_get_records", _object),
                    ClientTuple(_user_writer, "can_upsert_records", _object),
                    ClientTuple(_user_writer, "can_count_records", _object),
                    ClientTuple(_user_writer, "can_query_records", _object),
                    ClientTuple(_user_writer, "can_get_collection", _object_for_get_collection),
                    ClientTuple(_user_writer, "can_delete_collection", _object_for_get_collection),
                    ClientTuple(_user_writer, "can_update_collection", _object),
                ]
            )
        if _user_reader:
            fga_client.write_tuples(
                body=[
                    ClientTuple(_user_reader, "can_get_records", _object),
                    ClientTuple(_user_reader, "can_query_records", _object),
                    ClientTuple(_user_reader, "can_count_records", _object),
                    ClientTuple(_user_reader, "can_get_collection", _object_for_get_collection),
                ]
            )
```

Full code

You can find the full code in `chroma_auth/authz/openfga/openfga_permissions.py`

Looks pretty straight, but hold on I hear a thought creeping in your mind. “Why are you adding roles manually?”

You are right, it lacks that DRY-je-ne-sais-quoi, and I’m happy to keep it simple an explicit. A more mature implementation can read the model figure out what type we’re adding permissions for and then for each relation add the requisite users, but premature optimization is difficult to put in an article that won’t turn into a book.

With the above code we make the assumption that the collection doesn’t exist ergo its permissions tuples don’t exist. ( OpenFGA will fail to add tuples that already exist and there is not way around it other than deleting them first). Remember permission tuple lifecycle is your responsibility when adding authz to your application.

The delete is oddly similar (that’s why we’ve skipped the bulk of it):

```python
def delete_collection_permissions(self, collection: Collection, request: Request) -> None:
    if not hasattr(request.state, "user_identity"):
        return
    identity = request.state.user_identity

    _object = f"collection:{collection.tenant}-{collection.database}-{collection.id}"
    _object_for_get_collection = f"collection:{collection.tenant}-{collection.database}-{collection.name}"  # this is a bug in the Chroma Authz that feeds in the name of the collection instead of ID
    _user = f"team:{identity.get_user_attributes()['team']}#owner" if identity.get_user_attributes() and "team" in identity.get_user_attributes() else f"user:{identity.get_user_id()}"
    _user_writer = f"team:{identity.get_user_attributes()['team']}#writer" if identity.get_user_attributes() and "team" in identity.get_user_attributes() else None
    _user_reader = f"team:{identity.get_user_attributes()['team']}#reader" if identity.get_user_attributes() and "team" in identity.get_user_attributes() else None
    with OpenFgaClient(self._fga_configuration) as fga_client:
        fga_client.delete_tuples(
            body=[
                ClientTuple(_user, "can_add_records", _object),
                ClientTuple(_user, "can_delete_records", _object),
                ClientTuple(_user, "can_update_records", _object),
                ClientTuple(_user, "can_get_records", _object),
                ClientTuple(_user, "can_upsert_records", _object),
                ClientTuple(_user, "can_count_records", _object),
                ClientTuple(_user, "can_query_records", _object),
                ClientTuple(_user, "can_get_collection", _object_for_get_collection),
                ClientTuple(_user, "can_delete_collection", _object_for_get_collection),
                ClientTuple(_user, "can_update_collection", _object),
            ]
        )
    # more code in the repo
```

Full code

You can find the full code in `chroma_auth/authz/openfga/openfga_permissions.py`

Let’s turn our attention at the last piece of code - the necessary evil of updating the FastAPI in Chroma to add our Permissions API hooks. We start simple by injecting our component using Chroma’s DI (dependency injection).

```python
from chroma_auth.authz.openfga.openfga_permissions import OpenFGAPermissionsAPI

self._permissionsApi: OpenFGAPermissionsAPI = self._system.instance(OpenFGAPermissionsAPI)
```

The we add a hook for collection creation:

```python
def create_collection(
        self,
        request: Request,
        collection: CreateCollection,
        tenant: str = DEFAULT_TENANT,
        database: str = DEFAULT_DATABASE,
) -> Collection:
    existing = None
    try:
        existing = self._api.get_collection(collection.name, tenant=tenant, database=database)
    except ValueError as e:
        if "does not exist" not in str(e):
            raise e
    collection = self._api.create_collection(
        name=collection.name,
        metadata=collection.metadata,
        get_or_create=collection.get_or_create,
        tenant=tenant,
        database=database,
    )
    if not existing:
        self._permissionsApi.create_collection_permissions(collection=collection, request=request)
    return collection
```

Full code

You can find the full code in `chroma_auth/instr/__init__.py`

And one for collection removal:

```python
def delete_collection(
        self,
        request: Request,
        collection_name: str,
        tenant: str = DEFAULT_TENANT,
        database: str = DEFAULT_DATABASE,
) -> None:
    collection = self._api.get_collection(collection_name, tenant=tenant, database=database)
    resp = self._api.delete_collection(
        collection_name, tenant=tenant, database=database
    )

    self._permissionsApi.delete_collection_permissions(collection=collection, request=request)
    return resp
```

Full code

You can find the full code in `chroma_auth/instr/__init__.py`

The key thing to observe about the above snippets is that we invoke permissions API when we’re sure things have been persisted in the DB. I know, I know, atomicity here is also important, but that is for another article. Just keep in mind that it is easier to fix broken permission than broken data.

I promise this was the last bit of python code you’ll see in this article.

## The Infra

Infrastructure!!! Finally, a sigh of relieve.

Let’s draw a diagrams:

[Link](https://excalidraw.com/#json=4wcUMJU5pNYEzzcmEj1BZ,a7z_MZUGf9m5t6OPu3RuiA)

We have our Chroma server, that relies on OpenFGA which persists data in PostgreSQL. “Ok, but …”, I can see you scratch your head, “… how do I bring this magnificent architecture to live?”. I thought you’d never ask. We’ll rely on our trusty docker compose skills with the following sequence in mind:

“Where is the `docker-compose.yaml`!”. Voilà, my impatient friends:

```yaml
version: '3.9'

networks:
  net:
    driver: bridge

services:
  server:
    depends_on:
      openfga:
        condition: service_healthy
      import:
        condition: service_completed_successfully
    image: chroma-server
    build:
      dockerfile: Dockerfile
    volumes:
      - ./chroma-data:/chroma/chroma
      - ./server.htpasswd:/chroma/server.htpasswd
      - ./groupfile:/chroma/groupfile
      - ./data/:/data
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
      - CHROMA_SERVER_AUTHZ_PROVIDER=${CHROMA_SERVER_AUTHZ_PROVIDER}
      - CHROMA_SERVER_AUTHZ_CONFIG_PROVIDER=${CHROMA_SERVER_AUTHZ_CONFIG_PROVIDER}
      - FGA_API_URL=http://openfga:8080
      - FGA_CONFIG_FILE=/data/store.json # we expect that the import job will create this file
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
  postgres:
    image: postgres:14
    container_name: postgres
    networks:
      - net
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U postgres" ]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data_openfga:/var/lib/postgresql/data

  migrate:
    depends_on:
      postgres:
        condition: service_healthy
    image: openfga/openfga:latest
    container_name: migrate
    command: migrate
    environment:
      - OPENFGA_DATASTORE_ENGINE=postgres
      - OPENFGA_DATASTORE_URI=postgres://postgres:password@postgres:5432/postgres?sslmode=disable
    networks:
      - net
  openfga:
    depends_on:
      migrate:
        condition: service_completed_successfully
    image: openfga/openfga:latest
    container_name: openfga
    environment:
      - OPENFGA_DATASTORE_ENGINE=postgres
      - OPENFGA_DATASTORE_URI=postgres://postgres:password@postgres:5432/postgres?sslmode=disable
      - OPENFGA_LOG_FORMAT=json
    command: run
    networks:
      - net
    ports:
      # Needed for the http server
      - "8082:8080"
      # Needed for the grpc server (if used)
      - "8083:8081"
      # Needed for the playground (Do not enable in prod!)
      - "3003:3000"
    healthcheck:
      test: [ "CMD", "/usr/local/bin/grpc_health_probe", "-addr=openfga:8081" ]
      interval: 5s
      timeout: 30s
      retries: 3
  import:
    depends_on:
      openfga:
        condition: service_healthy
    image: fga-cli
    build:
      context: .
      dockerfile: Dockerfile-fgacli
    container_name: import
    volumes:
      - ./data/:/data
    command: |
      /bin/sh -c "/data/create_store_and_import.sh"
    environment:
      - FGA_SERVER_URL=http://openfga:8080
    networks:
      - net
volumes:
  postgres_data_openfga:
    driver: local
```

Don’t forget to create an `.env` file:

```python
CHROMA_SERVER_AUTH_PROVIDER = "chromadb.auth.basic.BasicAuthServerProvider"
CHROMA_SERVER_AUTH_CREDENTIALS_FILE = "server.htpasswd"
CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER = "chroma_auth.authn.basic.MultiUserHtpasswdFileServerAuthCredentialsProvider"
CHROMA_SERVER_AUTHZ_PROVIDER = "chroma_auth.authz.openfga.OpenFGAAuthorizationProvider"
CHROMA_SERVER_AUTHZ_CONFIG_PROVIDER = "chroma_auth.authz.openfga.OpenFGAAuthorizationConfigurationProvider"
```

Update your `server.htpasswd` to include the new user:

```python
admin:$2
y$05$vkBK4b1Vk5O98jNHgr.uduTJsTOfM395sKEKe48EkJCVPH / MBIeHK
user1:$2
y$05$UQ0kC2x3T2XgeN4WU12BdekUwCJmLjJNhMaMtFNolYdj83OqiEpVu
admin - ext:$2
y$05$9.
L13wKQTHeXz9IH2UO2RurWEK. / Z24qapzyi6ywQGJds2DaC36C2
```

And the `groupfile` from before. And don’t forget to take a look at the import script under - `data/create_store_and_import.sh`

Run the following command at the root of the repo and let things fail and burn down (or in the event this works - awe you, disclaimer - it worked on my machine):

```python
docker
compose
up - -build
```

## Tests, who needs test when you have stable infra!

Authorization is serious stuff, which is why we’ve created a bare minimum set of tests to prove we’re not totally wrong about it!

Real Serious Note

Serious Note: Take these things seriously and write a copious amounts of tests before rolling out things to prod. Don’t become [OWASP Top10 “Hero”](https://owasp.org/Top10/). [Broken access](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) controls is a thing that WILL keep you up at night.

We’ll focus on three areas:

- Testing admin (owner) access
- Testing team access for owner and reader roles
- Testing cross team permissions

**Admin Access**

Simple check to ensure that whoever created the collection (aka the owner) is allowed all actions.

```python
import uuid
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",
                      chroma_client_auth_credentials="admin:password123"))
client.heartbeat()  # this should work with or without authentication - it is a public endpoint
client.list_collections()  # this is a protected endpoint and requires authentication

col = client.get_or_create_collection(f"test_collection-{str(uuid.uuid4())}")
col.add(ids=["1"], documents=["test doc"])

col.get()
col.update(ids=["1"], documents=["test doc 2"])
col.count()
col.upsert(ids=["1"], documents=["test doc 3"])
col.delete(ids=["1"])

client.delete_collection(col.name)
```

Full code

You can find the full code in `test_auth.ipynb`

**Team Access**

Team access tests whether roles and permissions associated with those roles are correctly enforced.

```python
import uuid
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",
                      chroma_client_auth_credentials="admin:password123"))
client.heartbeat()  # this should work with or without authentication - it is a public endpoint
client.list_collections()  # this is a protected endpoint and requires authentication

col_name = f"test_collection-{str(uuid.uuid4())}"
col = client.get_or_create_collection(col_name)
print(f"Creating collection {col.id}")
col.add(ids=["1"], documents=["test doc"])

client.get_collection(col_name)
client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",
                      chroma_client_auth_credentials="user1:password123"))

client.heartbeat()  # this should work with or without authentication - it is a public endpoint
client.list_collections()  # this is a protected endpoint and requires authentication
client.count_collections()
print("Getting collection " + col_name)
col = client.get_collection(col_name)
col.get()
col.count()

try:
    client.delete_collection(col_name)
except Exception as e:
    print(e)  #expect unauthorized error

client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",
                      chroma_client_auth_credentials="admin:password123"))

client.delete_collection(col_name)
```

Full code

You can find the full code in `test_auth.ipynb`

**Cross-team access**

In the cross team access scenario we’ll create a collection with one team owner (`admin`) and will try to access it (aka delete it) with another team’s owner in a very mano-a-mano (owner-to-owner way). It is important to observe that all these collections are created within the same database (`default_database`)

```python
import uuid
import chromadb
from chromadb.config import Settings

col_name = f"test_collection-{str(uuid.uuid4())}"
client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",
                      chroma_client_auth_credentials="admin:password123"))

client.get_or_create_collection(col_name)

client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",
                      chroma_client_auth_credentials="admin-ext:password123"))

client.get_or_create_collection("external-collection")

try:
    client.delete_collection(col_name)
except Exception as e:
    print("Expected error for admin-ext: ", str(e))  #expect unauthorized error

client = chromadb.HttpClient(
    settings=Settings(chroma_client_auth_provider="chromadb.auth.basic.BasicAuthClientProvider",
                      chroma_client_auth_credentials="admin:password123"))
client.delete_collection(col_name)
try:
    client.delete_collection("external-collection")
except Exception as e:
    print("Expected error for admin: ", str(e))  #expect unauthorized error
```

Full code

You can find the full code in `test_auth.ipynb`
