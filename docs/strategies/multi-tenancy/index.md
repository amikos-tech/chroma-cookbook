# Multi-Tenancy Strategies

## Introduction

Some deployment settings of Chroma may require multi-tenancy support. This document outlines the strategies for
multi-tenancy approaches in Chroma.

## Approaches

- [Naive approach](naive-multi-tenancy.md) - This is a simple approach puts the onus of enforcing multi-tenancy on the
  application. It is the simplest approach to implement, but is not very well suited for production environments.
- [Multi-User Basic Auth](multi-user-basic-auth.md) - This article provides a stepping stone to more advanced
  multi-tenancy where the Chroma
  authentication allows for multiple users to access the same Chroma instance with their own credentials.
- [Authorization Model with OpenFGA](authorization-model-with-openfga.md) - Implement an advanced authorization model
  with OpenFGA.
- [Implementing OpenFGA Authorization Model In Chroma](authorization-model-impl-with-openfga.md) - Learn how to
  implement OpenFGA authorization model in Chroma with full code example.
