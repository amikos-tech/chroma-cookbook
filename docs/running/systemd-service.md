# Systemd service

You can run Chroma as a systemd service which wil allow you to automatically start Chroma on boot and restart it if it
crashes.

## Docker Compose

The following is an examples systemd service for running Chroma using Docker Compose.

Create a file `/etc/systemd/system/chroma.service` with the following content:

!!! note "Example assumptions"

    The below example assumes Debian-based system with docker-ce installed.

```ini
[Unit]
Description = Chroma Service
After = network.target docker.service
Requires = docker.service

[Service]
Type = forking
User = root
Group = root
WorkingDirectory = /home/admin/chroma
ExecStart = /usr/bin/docker compose up -d
ExecStop = /usr/bin/docker compose down
RemainAfterExit = true

[Install]
WantedBy = multi-user.target
```

Replace `WorkingDirectory` with the path to your docker compose is. You may also need to replace `/usr/bin/docker`
with the path to your docker binary.

Alternatively you can install directly from a gist:

```bash
wget https://gist.githubusercontent.com/tazarov/9c46966de0b32a4962dcc79dce8b2646/raw/7cf8c471f33fba8a51d6f808f9b1af6ca1b0923c/chroma-docker.service \
  -O /etc/systemd/system/chroma.service
```

Loading, enabling and starting the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable chroma
sudo systemctl start chroma
```

!!! tip "Type=forking"

    In the above example, we use `Type=forking` because Docker Compose runs in the background (`-d`). If you are using a different
    command that runs in the foreground, you may need to use `Type=simple` instead.


## Chroma CLI

The following is an examples systemd service for running Chroma using the Chroma CLI.

Create a file `/etc/systemd/system/chroma.service` with the following content:

!!! note "Example assumptions"

    The below example assumes that Chroma is installed in Python `site-packages` package.

```ini
[Unit]
Description = Chroma Service
After = network.target

[Service]
Type = simple
User = root
Group = root
WorkingDirectory = /chroma
ExecStart=/usr/local/bin/chroma run --host 127.0.0.1 --port 8000 --path /chroma/data --log-path /var/log/chroma.log

[Install]
WantedBy = multi-user.target
```

Replace the `WorkingDirectory`, `/chroma/data` and `/var/log/chroma.log` with the appropriate paths.

!!! note "Safe Config"

    The above example service listens and `localhost` which may not work if you are looking to expose Chroma to outside world.
    Adjust the `--host` and `--port` flags as needed.

Alternatively you can install from a gist:

```bash
wget https://gist.githubusercontent.com/tazarov/5e10ce892c06757d8188a8a34cd6d26d/raw/327a9d0b07afeb0b0cb77453aa9171fdd190984f/chroma-cli.service \
  -O /etc/systemd/system/chroma.service
```

Loading, enabling and starting the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable chroma
sudo systemctl start chroma
```

!!! tip "Type=simple"

    In the above example, we use `Type=simple` because the Chroma CLI runs in the foreground. If you are using a different
    command that runs in the background, you may need to use `Type=forking` instead.