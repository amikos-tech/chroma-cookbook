# Multi-Tenancy Strategies

## Introduction

Some deployment settings of Chroma may require multi-tenancy support. This document outlines the strategies for multi-tenancy approaches in Chroma.

## Approaches

- [Naive approach](https://cookbook.chromadb.dev/strategies/multi-tenancy/naive-multi-tenancy/index.md) - This is a simple approach puts the onus of enforcing multi-tenancy on the application. It is the simplest approach to implement, but is not very well suited for production environments.
- [Multi-User Basic Auth](https://cookbook.chromadb.dev/strategies/multi-tenancy/multi-user-basic-auth/index.md) - This article provides a stepping stone to more advanced multi-tenancy where the Chroma authentication allows for multiple users to access the same Chroma instance with their own credentials.
- [Authorization Model with OpenFGA](https://cookbook.chromadb.dev/strategies/multi-tenancy/authorization-model-with-openfga/index.md) - Implement an advanced authorization model with OpenFGA.
- [Implementing OpenFGA Authorization Model In Chroma](https://cookbook.chromadb.dev/strategies/multi-tenancy/authorization-model-impl-with-openfga/index.md) - Learn how to implement OpenFGA authorization model in Chroma with full code example.
