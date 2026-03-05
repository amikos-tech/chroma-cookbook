---
title: Production incident runbook
env: prod
team: platform
---

# Production Incident Runbook

When latency spikes, start by checking recent deployments, database saturation, and downstream queue depth.

If error rates remain elevated for more than five minutes, trigger rollback and page the platform incident channel.

Document timeline updates every ten minutes with hypothesis, mitigation actions, and user impact.
