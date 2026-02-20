# Security

Security is an important topic and this section is devoted to it.

There are many ways to secure a service, such as Chroma and this section attempts to encompass the most common use cases.

Way to secure Chroma include:

- In-transit encryption using SSL/TLS certificates
- Access control
- At-rest encryption
- Adding authentication and authorization

## SSL/TLS Certificates

Securing your Chroma with a proxy is one of the most common ways to secure your Chroma. Ensuring that all traffic between your client and Chroma server is encrypted is a good practice.

There are multiple ways to secure your Chroma instance using SSL/TLS certificates and here we'll explore a few.

- [SSL/TLS certificate in Chroma server](https://cookbook.chromadb.dev/security/chroma-ssl-cert/index.md) - configure and use SSL/TLS certificates directly in Chroma.
- [Proxy with SSL/TLS termination](https://cookbook.chromadb.dev/security/ssl-proxies/index.md) - use a proxy to terminate SSL/TLS and forward traffic to Chroma.
- (Coming soon) Cloud Provider API Gateway with SSL/TLS termination - use a cloud provider's API Gateway to terminate SSL/TLS and forward traffic to Chroma.

## Authentication and Authorization

Version prior to 1.0.x support [legacy authentication and authorization](https://cookbook.chromadb.dev/security/legacy-auth/index.md) - Configure Chroma built-in authentication and authorization.

Versions 1.0.0-1.0.10 do not support Authentication or Authorization natively so you will need to adjust your deployment with a [proxy-based authentcation](https://cookbook.chromadb.dev/security/auth-1.0.x/index.md).
