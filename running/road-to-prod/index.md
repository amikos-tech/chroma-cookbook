# Road To Production

In this section we will cover considerations for operating Chroma ina production environment.

To operate Chroma in production your deployment must follow your organization's best practices and guidelines around business continuity, security, and compliance. Here we will list the core concepts and offer some guidance on how to achieve them.

Core system abilities:

- High Availability - The deployment should be able to handle failures while continuing to serve requests.
- Scalability - The deployment should be able to handle increased load by adding more resources (aka scale horizontally).
- Privacy and Security - The deployment should protect data from unauthorized access and ensure data integrity.
- Observability - The deployment should provide metrics and logs to help operators understand the system's health.
- Backup and Restore - The deployment should have a backup and restore strategy to protect against data loss.
- Disaster Recovery - The deployment should have a disaster recovery plan to recover from catastrophic failures.
- Maintenance - The deployment should be easy to maintain and upgrade.

While our guidance is most likely incomplete it can be taken as a compliment to your own organizational processes. For those deploying Chroma in a smaller enterprise without such processes, we advise common sense and caution.

## High Availability

## Scalability

## Privacy and Security

### Data Security

#### In Transit

The bare minimum for securing data in transit is to use HTTPS when performing Chroma API calls. This ensures that data is encrypted when it is sent over the network.

There are several ways to achieve this:

- Use a reverse proxy like Envoy or Nginx to terminate SSL/TLS connections.
- Use a load balancer like AWS ELB or Google Cloud Load Balancer to terminate SSL/TLS connections (technically a Envoy and Nginx are also LBs).
- Use a service mesh like Istio or Linkerd to manage SSL/TLS connections between services.
- Enable SSL/TLS in your Chroma server.

Depending on your requirements you may choose one or more of these options.

**Reverse Proxy:**

**Load Balancer:**

**Service Mesh:**

**Chroma Server:**

#### At Rest

### Access Control

#### Authentication

#### Authorization

## Observability

## Backup and Restore

## Disaster Recovery

## Maintenance
