# Security

Security is an important topic and this section is devoted to it.

There are many ways to secure a service, such as Chroma and this section attempts to encompass the most common use
cases.

Way to secure Chroma include:

- In-transit encryption using SSL/TLS certificates
- Access control
- At-rest encryption
- Adding authentication and authorization

## SSL/TLS Certificates

Securing your Chroma with a proxy is one of the most common ways to secure your Chroma.
Ensuring that all traffic between your client and Chroma server is encrypted is a good practice.

There are multiple ways to secure your Chroma instance using SSL/TLS certificates and here we'll explore a few.

- [SSL/TLS certificate in Chroma server](chroma-ssl-cert.md) - configure and use SSL/TLS certificates directly in Chroma.
- (Coming soon) Proxy with SSL/TLS termination - use a proxy to terminate SSL/TLS and forward traffic to Chroma.
- (Coming soon) Cloud Provider API Gateway with SSL/TLS termination - use a cloud provider's API Gateway to terminate SSL/TLS and
  forward traffic to Chroma.

## Authentication and Authorization

Chroma offers built-in authentication and authorization mechanisms to secure your Chroma instance.

- [Chroma-native Auth](auth.md) - Configure Chroma built-in authentication and authorization.